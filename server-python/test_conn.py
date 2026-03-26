import asyncio
from TikTokLive import TikTokLiveClient
import sys
import logging

logging.basicConfig(level=logging.DEBUG)

async def main():
    username = "@ztvl0"
    print(f"Connecting to {username}...")
    client = TikTokLiveClient(unique_id=username)
    
    try:
        # Connect to the room
        connected = await client.connect()
        print(f"Connected: {connected}")
        print(f"Room Info: {client.room_info}")
    except Exception as e:
        print(f"Failed to connect: {e}")

if __name__ == "__main__":
    asyncio.run(main())
