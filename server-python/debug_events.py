import asyncio
import sys
from TikTokLive import TikTokLiveClient
from TikTokLive.events import CommentEvent, LikeEvent

async def main():
    client = TikTokLiveClient(unique_id="@ztvl0")
    
    @client.on(CommentEvent)
    async def on_comment(event: CommentEvent):
        print("--- COMMENT EVENT ---")
        user = getattr(event, "user", None)
        if user:
            print(f"User ID: {getattr(user, 'id', 'N/A')}")
            print(f"User user_id: {getattr(user, 'user_id', 'N/A')}")
            print(f"User nickname: {getattr(user, 'nickname', getattr(user, 'nick_name', 'N/A'))}")
            # we just need 1 comment
            
    @client.on(LikeEvent)
    async def on_like(event: LikeEvent):
        print("--- LIKE EVENT ---")
        user = getattr(event, "user", None)
        if user:
            print(f"User ID: {getattr(user, 'id', 'N/A')}")
            print(f"User user_id: {getattr(user, 'user_id', 'N/A')}")
            print(f"User nickname: {getattr(user, 'nickname', getattr(user, 'nick_name', 'N/A'))}")
        print("Exiting...")
        sys.exit(0)

    try:
        # Run for 15 seconds max
        await asyncio.wait_for(client.start(), timeout=15.0)
    except asyncio.TimeoutError:
        print("Timed out waiting for events")
        sys.exit(0)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
