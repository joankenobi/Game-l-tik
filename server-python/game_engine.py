import asyncio
from typing import Dict, List, Optional
from pydantic import BaseModel

class Player(BaseModel):
    userId: str
    uniqueId: str
    nickname: str
    profilePictureUrl: str
    countryCode: str
    contribution: int = 0

class CountryScore(BaseModel):
    code: str
    score: int = 0
    contributorCount: int = 0

class GameEngine:
    def __init__(self, sio):
        self.sio = sio
        self.players: Dict[str, Player] = {}
        self.countries: Dict[str, Dict] = {}
        self.game_active = False
        self.game_timer = 3600
        self.timer_task = None

    def register_player(self, data: any, country: str):
        unique_id = data.get('uniqueId')
        
        country_map = {
            'mx': 'Mexico', 'mexico': 'Mexico', 'mex': 'Mexico', '1': 'Mexico',
            'ar': 'Argentina', 'argentina': 'Argentina', '2': 'Argentina',
            'co': 'Colombia', 'colombia': 'Colombia', '3': 'Colombia',
            'es': 'España', 'espana': 'España', 'españa': 'España', '4': 'España', 'spain': 'España',
            'us': 'USA', 'usa': 'USA', 'united states': 'USA', '5': 'USA',
            'pe': 'Peru', 'peru': 'Peru', '6': 'Peru',
            'cl': 'Chile', 'chile': 'Chile', '7': 'Chile',
            'ec': 'Ecuador', 'ecuador': 'Ecuador', '8': 'Ecuador',
            've': 'Venezuela', 'venezuela': 'Venezuela', '9': 'Venezuela',
            'bo': 'Bolivia', 'bolivia': 'Bolivia', '10': 'Bolivia',
            'py': 'Paraguay', 'paraguay': 'Paraguay', '11': 'Paraguay',
            'uy': 'Uruguay', 'uruguay': 'Uruguay', '12': 'Uruguay',
            'sv': 'El Salvador', 'elsalvador': 'El Salvador', '13': 'El Salvador',
            'jp': 'Japon', '14': 'Japon',
            'br': 'Brasil', 'brasil': 'Brasil', '15': 'Brasil',
            'pt': 'Portugal', 'portugal': 'Portugal', '16': 'Portugal',
            'it': 'Italia', 'italia': 'Italia', '17': 'Italia',
            'de': 'Alemania', 'alemania': 'Alemania', '18': 'Alemania',
            'fr': 'Francia', 'francia': 'Francia', '19': 'Francia',
            'gb': 'Reino Unido', 'reino unido': 'Reino Unido', '20': 'Reino Unido',
            'gr': 'Grecia', 'grecia': 'Grecia', '21': 'Grecia',
        }
        
        country_code = country_map.get(country.lower().strip())
        if not country_code:
            return  # Invalid country or random comment
            
        if unique_id and unique_id not in self.players:
            self.players[unique_id] = Player(
                userId=data.get('userId', ''),
                uniqueId=unique_id,
                nickname=data.get('nickname'),
                profilePictureUrl=data.get('profilePictureUrl'),
                countryCode=country_code
            )
            
            # Ensure country exists in scores
            if country_code not in self.countries:
                self.countries[country_code] = {"score": 0, "contributors": set()}
            
            self.countries[country_code]["contributors"].add(unique_id)

    def add_points(self, unique_id: str, points: int):
        player = self.players.get(unique_id)
        if player:
            player.contribution += points
            code = player.countryCode
            if code in self.countries:
                self.countries[code]["score"] += points
                # Re-add just in case
                self.countries[code]["contributors"].add(unique_id)
            
            asyncio.create_task(self.emit_game_state())

    async def start_game(self):
        self.game_active = True
        self.game_timer = 3600 # Reset timer
        if self.timer_task:
            self.timer_task.cancel()
        self.timer_task = asyncio.create_task(self.tick())

    async def stop_game(self):
        self.game_active = False
        if self.timer_task:
            self.timer_task.cancel()
            self.timer_task = None
        await self.emit_game_state()

    async def tick(self):
        while self.game_active and self.game_timer > 0:
            await asyncio.sleep(1)
            self.game_timer -= 1
            await self.emit_game_state()
            if self.game_timer <= 0:
                await self.stop_game()

    def get_game_state(self):
        sorted_countries = sorted(
            [
                {
                    "code": code,
                    "score": data["score"],
                    "contributorCount": len(data["contributors"])
                }
                for code, data in self.countries.items()
            ],
            key=lambda x: x["score"],
            reverse=True
        )
        return {
            "countries": sorted_countries,
            "timer": self.game_timer,
            "isActive": self.game_active
        }

    async def emit_game_state(self):
        state = self.get_game_state()
        await self.sio.emit('gameState', state)

    def is_active(self):
        return self.game_active

    def get_player(self, unique_id: str):
        return self.players.get(unique_id)
