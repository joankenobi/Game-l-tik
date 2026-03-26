import asyncio
from TikTokLive import TikTokLiveClient
from TikTokLive.events import CommentEvent, LikeEvent, GiftEvent, ConnectEvent, DisconnectEvent


class TikTokService:
    def __init__(self, game_engine, sio):
        self.game_engine = game_engine
        self.sio = sio
        self.client: TikTokLiveClient = None
        self._connected = False

    async def connect(self, username: str):
        if self.client and self.client.connected:
            await self.client.stop()
            
        self.client = TikTokLiveClient(unique_id=f"@{username}" if not username.startswith("@") else username)
        
        # Register events
        self.client.on(ConnectEvent, self.on_connect)
        self.client.on(DisconnectEvent, self.on_disconnect)
        self.client.on(CommentEvent, self.on_chat)
        self.client.on(LikeEvent, self.on_like)
        self.client.on(GiftEvent, self.on_gift)
        
        async def _run_client():
            try:
                await self.client.start()
            except Exception as e:
                print(f"TikTokClient background error: {e}")
                
                # Check if there is an active loop internally to safely emit without create_task here
                # but sio.emit itself is coroutine
                try:
                    await self.sio.emit('status', {"connected": False, "error": str(e)})
                except Exception as emit_err:
                    print(f"Failed to emit error status: {emit_err}")

        try:
            # We run in background
            asyncio.create_task(_run_client())
            return True
        except Exception as e:
            print(f"Failed to connect to TikTok: {e}")
            await self.sio.emit('status', {"connected": False, "error": str(e)})
            return False

    async def disconnect(self):
        if self.client and self.client.connected:
            await self.client.stop()

    async def on_connect(self, event: ConnectEvent):
        print(f"Connected to TikTok Room ID: {self.client.room_id}")
        self._connected = True
        await self.sio.emit('status', {"connected": True, "roomId": self.client.room_id})

    async def on_disconnect(self, event: DisconnectEvent):
        print("Disconnected from TikTok")
        self._connected = False
        await self.sio.emit('status', {"connected": False})

    async def on_chat(self, event: CommentEvent):
        if not self.game_engine.is_active():
            print("Ignoring chat (game inactive)")
            return
        
        country = getattr(event, "content", getattr(event, "comment", "")).strip()
        print(f"💬 Chat received: '{country}'")
        print(f"DEBUG Comment User: {dir(event.user)}")
        
        avatar = getattr(event.user, "avatar_thumb", getattr(event.user, "avatar", None))
        urls = getattr(avatar, "m_urls", getattr(avatar, "url_list", getattr(avatar, "urls", []))) if avatar else []
        
        user_data = {
            "userId": str(getattr(event.user, "id", "") or getattr(event.user, "user_id", "")),
            "uniqueId": getattr(event.user, "username", getattr(event.user, "display_id", "")),
            "nickname": getattr(event.user, "nick_name", getattr(event.user, "nickname", "")),
            "profilePictureUrl": urls[0] if urls else ""
        }
        self.game_engine.register_player(user_data, country)

    async def on_like(self, event: LikeEvent):
        if not self.game_engine.is_active():
            print("Like ignored (game inactive)")
            return
        
        print(f"DEBUG Like User: {dir(event.user)}")
        unique_id = getattr(event.user, "username", getattr(event.user, "display_id", ""))
        player = self.game_engine.get_player(unique_id)
        
        print(f"👍 LikeEvent from unique_id: {unique_id}, Found in players: {player is not None}")
        
        if player:
            # Add points
            count = getattr(event, "count", getattr(event, "like_count", 1))
            self.game_engine.add_points(unique_id, count)
            print(f"❤️ {player.nickname} sent {count} likes")
            
            # Visual update
            await self.sio.emit('likeEvent', {
                "username": player.nickname,
                "country": player.countryCode,
                "likeCount": count
            })

    async def on_gift(self, event: GiftEvent):
        if not self.game_engine.is_active():
            return
            
        # Match Node logic: repeatEnd or non-repeatable
        # TikTokLive handles repeat natively
        is_repeat_end = getattr(event.gift, "repeat_end", False) if hasattr(event.gift, "repeat_end") else getattr(event.gift, "is_repeat_end", False)
        # Type 1 usually means streakable
        if is_repeat_end or getattr(event.gift, "type", 0) != 1:
            unique_id = getattr(event.user, "username", getattr(event.user, "display_id", ""))
            player = self.game_engine.get_player(unique_id)
            if player:
                points = 0
                gift_name = getattr(event.gift, "name", "unknown gift").lower()
                gift_count = getattr(event.gift, "count", getattr(event.gift, "repeat_count", 1))
                diamond_count = getattr(event.gift, "diamond_count", None)
                if diamond_count is None and hasattr(event.gift, "info"):
                    diamond_count = getattr(event.gift.info, "diamond_count", 0)
                else:
                    diamond_count = diamond_count or 0
                
                if 'rose' in gift_name:
                    points = 10 * gift_count
                elif 'cap' in gift_name or 'tiktok' in gift_name:
                    points = 100 * gift_count
                else:
                    points = (diamond_count * 1) * gift_count
                
                if points > 0:
                    self.game_engine.add_points(unique_id, points)
                    
                    # Visual Event
                    await self.sio.emit('event', {
                        "type": "gift",
                        "user": player.nickname,
                        "country": player.countryCode,
                        "gift": gift_name,
                        "points": points
                    })
