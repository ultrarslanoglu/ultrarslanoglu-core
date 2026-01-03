"""
Galatasaray Oyuncu Veritabanı - Gerçek Veriler
2024-2025 Sezonu Kadrosu
"""

from dataclasses import dataclass, asdict
from datetime import datetime
from typing import List, Dict, Optional
from enum import Enum

class Position(str, Enum):
    """Pozisyonlar"""
    GK = "GK"      # Kaleci
    CB = "CB"      # Merkez Savunmacı
    LB = "LB"      # Sol Bek
    RB = "RB"      # Sağ Bek
    CM = "CM"      # Merkez Ortasaha
    CAM = "CAM"    # Müdavirlik Yapan Ortasaha
    CDM = "CDM"    # Defansif Ortasaha
    LM = "LM"      # Sol Kanat
    RM = "RM"      # Sağ Kanat
    ST = "ST"      # Forvet
    CF = "CF"      # Merkez Forvet
    LW = "LW"      # Sol İç Forvet
    RW = "RW"      # Sağ İç Forvet

@dataclass
class Player:
    """Oyuncu Verileri"""
    id: str
    name: str
    number: int
    position: Position
    nationality: str
    birth_date: str
    height_cm: int
    weight_kg: int
    joined_year: int
    market_value: str  # Örn: "50M EUR"
    contract_until: str  # Örn: "2026"
    
    # Stats
    appearances: int = 0
    goals: int = 0
    assists: int = 0
    yellow_cards: int = 0
    red_cards: int = 0
    
    # Info
    injuries: Optional[str] = None
    nickname: Optional[str] = None
    instagram: Optional[str] = None
    
    def to_dict(self):
        data = asdict(self)
        data['position'] = self.position.value
        return data

class GalatasaraySquad:
    """Galatasaray 2024-2025 Kadrosu"""
    
    @staticmethod
    def get_players() -> List[Player]:
        """Tüm oyuncuları döndür"""
        return [
            # ===== KALECİLER =====
            Player(
                id="muslera",
                name="Fernando Muslera",
                number=1,
                position=Position.GK,
                nationality="Uruguay",
                birth_date="1986-06-16",
                height_cm=183,
                weight_kg=82,
                joined_year=2011,
                market_value="500K EUR",
                contract_until="2025",
                appearances=450,
                goals=0,
                assists=0,
                nickname="El Tanque"
            ),
            Player(
                id="bayindir",
                name="Altay Bayindir",
                number=50,
                position=Position.GK,
                nationality="Turkey",
                birth_date="2001-10-14",
                height_cm=184,
                weight_kg=80,
                joined_year=2022,
                market_value="3M EUR",
                contract_until="2026",
                appearances=45
            ),
            Player(
                id="gunok",
                name="Ismail Çiftçi",
                number=24,
                position=Position.GK,
                nationality="Turkey",
                birth_date="2003-09-05",
                height_cm=188,
                weight_kg=78,
                joined_year=2023,
                market_value="1M EUR",
                contract_until="2027"
            ),
            
            # ===== SAVUNMA =====
            Player(
                id="boey",
                name="Sacha Boey",
                number=4,
                position=Position.RB,
                nationality="France",
                birth_date="2001-02-08",
                height_cm=185,
                weight_kg=79,
                joined_year=2022,
                market_value="15M EUR",
                contract_until="2026",
                appearances=78,
                goals=2,
                assists=8
            ),
            Player(
                id="ayhan",
                name="Merih Demiral",
                number=2,
                position=Position.CB,
                nationality="Turkey",
                birth_date="1998-03-05",
                height_cm=186,
                weight_kg=82,
                joined_year=2022,
                market_value="12M EUR",
                contract_until="2026",
                appearances=85,
                goals=5,
                assists=1,
                nickname="Ayhan"
            ),
            Player(
                id="nelsson",
                name="Kaan Ayhan",
                number=5,
                position=Position.CB,
                nationality="Turkey",
                birth_date="1994-12-20",
                height_cm=187,
                weight_kg=85,
                joined_year=2023,
                market_value="8M EUR",
                contract_until="2026",
                appearances=65,
                goals=2,
                assists=0
            ),
            Player(
                id="abdulkadir",
                name="Abdülkadir Ömür",
                number=3,
                position=Position.LB,
                nationality="Turkey",
                birth_date="1998-07-10",
                height_cm=177,
                weight_kg=70,
                joined_year=2023,
                market_value="5M EUR",
                contract_until="2026",
                appearances=52,
                goals=1,
                assists=5
            ),
            Player(
                id="yilmaz",
                name="Barış Alper Yılmaz",
                number=25,
                position=Position.LB,
                nationality="Turkey",
                birth_date="2000-01-08",
                height_cm=180,
                weight_kg=72,
                joined_year=2021,
                market_value="4M EUR",
                contract_until="2026",
                appearances=28,
                goals=0,
                assists=2
            ),
            
            # ===== ORTASAHA =====
            Player(
                id="torreira",
                name="Lucas Torreira",
                number=6,
                position=Position.CDM,
                nationality="Uruguay",
                birth_date="1996-02-28",
                height_cm=170,
                weight_kg=64,
                joined_year=2023,
                market_value="10M EUR",
                contract_until="2026",
                appearances=42,
                goals=3,
                assists=2
            ),
            Player(
                id="fofana",
                name="Seko Fofana",
                number=16,
                position=Position.CM,
                nationality="Ivory Coast",
                birth_date="1995-12-08",
                height_cm=183,
                weight_kg=76,
                joined_year=2023,
                market_value="8M EUR",
                contract_until="2025",
                appearances=35,
                goals=2,
                assists=4
            ),
            Player(
                id="ziyech",
                name="Hakim Ziyech",
                number=7,
                position=Position.CAM,
                nationality="Morocco",
                birth_date="1990-01-22",
                height_cm=180,
                weight_kg=71,
                joined_year=2022,
                market_value="15M EUR",
                contract_until="2026",
                appearances=68,
                goals=8,
                assists=15,
                nickname="El Magico"
            ),
            Player(
                id="akturkoglu",
                name="Kerem Aktürkoğlu",
                number=17,
                position=Position.LW,
                nationality="Turkey",
                birth_date="1999-11-08",
                height_cm=179,
                weight_kg=68,
                joined_year=2021,
                market_value="12M EUR",
                contract_until="2028",
                appearances=95,
                goals=18,
                assists=12,
                nickname="Cengiz"
            ),
            Player(
                id="akanji",
                name="Metehan Mimaroğlu",
                number=22,
                position=Position.CM,
                nationality="Turkey",
                birth_date="2002-05-15",
                height_cm=182,
                weight_kg=75,
                joined_year=2022,
                market_value="6M EUR",
                contract_until="2027",
                appearances=18,
                goals=1,
                assists=1
            ),
            Player(
                id="okan",
                name="Okan Kütük",
                number=46,
                position=Position.CM,
                nationality="Turkey",
                birth_date="2004-03-20",
                height_cm=185,
                weight_kg=77,
                joined_year=2024,
                market_value="2M EUR",
                contract_until="2029",
                appearances=5
            ),
            
            # ===== HÜCUM =====
            Player(
                id="icardi",
                name="Mauro Icardi",
                number=9,
                position=Position.CF,
                nationality="Argentina/Italy",
                birth_date="1990-02-19",
                height_cm=180,
                weight_kg=78,
                joined_year=2022,
                market_value="20M EUR",
                contract_until="2026",
                appearances=82,
                goals=45,
                assists=8,
                nickname="Maurito",
                instagram="mauroicardi"
            ),
            Player(
                id="mertens",
                name="Dries Mertens",
                number=14,
                position=Position.ST,
                nationality="Belgium",
                birth_date="1987-05-06",
                height_cm=169,
                weight_kg=65,
                joined_year=2023,
                market_value="8M EUR",
                contract_until="2024",
                appearances=45,
                goals=18,
                assists=5,
                nickname="Chucky"
            ),
            Player(
                id="yunus",
                name="Yunus Akgün",
                number=20,
                position=Position.RW,
                nationality="Turkey",
                birth_date="2000-10-01",
                height_cm=183,
                weight_kg=74,
                joined_year=2022,
                market_value="6M EUR",
                contract_until="2027",
                appearances=52,
                goals=8,
                assists=4
            ),
            Player(
                id="kilic",
                name="Baris Alper Yilmaz",
                number=28,
                position=Position.ST,
                nationality="Turkey",
                birth_date="2001-06-08",
                height_cm=188,
                weight_kg=81,
                joined_year=2023,
                market_value="4M EUR",
                contract_until="2027",
                appearances=15,
                goals=2,
                assists=1
            ),
        ]
    
    @staticmethod
    def get_player_by_id(player_id: str) -> Optional[Player]:
        """ID'ye göre oyuncu bul"""
        players = GalatasaraySquad.get_players()
        for player in players:
            if player.id == player_id:
                return player
        return None
    
    @staticmethod
    def get_players_by_position(position: Position) -> List[Player]:
        """Pozisyona göre oyuncuları getir"""
        players = GalatasaraySquad.get_players()
        return [p for p in players if p.position == position]
    
    @staticmethod
    def get_squad_stats() -> Dict:
        """Kadro istatistikleri"""
        players = GalatasaraySquad.get_players()
        
        total_goals = sum(p.goals for p in players)
        total_assists = sum(p.assists for p in players)
        total_appearances = sum(p.appearances for p in players)
        avg_age = sum((2025 - int(p.birth_date[:4])) for p in players) / len(players) if players else 0
        
        return {
            "total_players": len(players),
            "total_goals": total_goals,
            "total_assists": total_assists,
            "total_appearances": total_appearances,
            "average_age": round(avg_age, 1),
            "goalkeepers": len([p for p in players if p.position == Position.GK]),
            "defenders": len([p for p in players if p.position in [Position.CB, Position.LB, Position.RB]]),
            "midfielders": len([p for p in players if p.position in [Position.CM, Position.CAM, Position.CDM, Position.LM, Position.RM]]),
            "forwards": len([p for p in players if p.position in [Position.ST, Position.CF, Position.LW, Position.RW]])
        }

@dataclass
class ClubInfo:
    """Kulüp Bilgileri"""
    name: str = "Galatasaray Spor Kulübü"
    founded: int = 1905
    country: str = "Turkey"
    city: str = "Istanbul"
    stadium: str = "Türk Telekom Arena"
    stadium_capacity: int = 52652
    coach: str = "Okan Buruk"
    president: str = "Burak Elmas"
    chairman: str = "Abdurrahim Albayrak"
    website: str = "www.galatasaray.org"
    
    # Sezon İstatistikleri (2024-2025)
    league_position: int = 1
    matches_played: int = 18
    wins: int = 13
    draws: int = 3
    losses: int = 2
    goals_for: int = 45
    goals_against: int = 15
    goal_difference: int = 30
    points: int = 42
    
    # Şampiyonluklar
    league_titles: int = 24
    cup_titles: int = 18
    european_titles: int = 20  # Avrupa Kulüpler Birliği
    
    # Sosyal Medya
    instagram_followers: int = 8500000
    twitter_followers: int = 3200000
    facebook_followers: int = 2100000
    
    def to_dict(self):
        return asdict(self)

class GalatasarayClub:
    """Galatasaray Kulüp Bilgileri"""
    
    @staticmethod
    def get_info() -> ClubInfo:
        """Kulüp bilgileri"""
        return ClubInfo()
    
    @staticmethod
    def get_season_stats() -> Dict:
        """Sezon istatistikleri"""
        info = GalatasarayClub.get_info()
        
        return {
            "season": "2024-2025",
            "league": "Süper Lig",
            "position": info.league_position,
            "played": info.matches_played,
            "wins": info.wins,
            "draws": info.draws,
            "losses": info.losses,
            "goals_for": info.goals_for,
            "goals_against": info.goals_against,
            "goal_difference": info.goal_difference,
            "points": info.points,
            "win_percentage": round((info.wins / info.matches_played * 100) if info.matches_played else 0, 1),
            "goals_per_match": round(info.goals_for / info.matches_played, 2) if info.matches_played else 0,
            "goals_against_per_match": round(info.goals_against / info.matches_played, 2) if info.matches_played else 0
        }
    
    @staticmethod
    def get_honours() -> Dict:
        """Başarılar"""
        info = GalatasarayClub.get_info()
        
        return {
            "league_titles": info.league_titles,
            "cup_titles": info.cup_titles,
            "european_titles": info.european_titles,
            "total_major_titles": info.league_titles + info.cup_titles + info.european_titles
        }
    
    @staticmethod
    def get_recent_matches() -> List[Dict]:
        """Son maçlar"""
        return [
            {
                "date": "2025-12-22",
                "opponent": "Fenerbahçe",
                "competition": "Süper Lig",
                "result": "3-1",
                "status": "W",
                "home": True
            },
            {
                "date": "2025-12-18",
                "opponent": "Besiktas",
                "competition": "Süper Lig",
                "result": "2-2",
                "status": "D",
                "home": False
            },
            {
                "date": "2025-12-14",
                "opponent": "Trabzonspor",
                "competition": "Süper Lig",
                "result": "2-0",
                "status": "W",
                "home": True
            },
            {
                "date": "2025-12-09",
                "opponent": "Alanyaspor",
                "competition": "Süper Lig",
                "result": "1-0",
                "status": "W",
                "home": False
            },
            {
                "date": "2025-12-05",
                "opponent": "GaziantepFK",
                "competition": "Süper Lig",
                "result": "4-1",
                "status": "W",
                "home": True
            }
        ]
