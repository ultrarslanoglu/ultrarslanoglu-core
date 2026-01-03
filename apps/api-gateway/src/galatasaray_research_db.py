#!/usr/bin/env python3
"""
Galatasaray Global Supporters Research Database
MongoDB data management and analysis script
Author: Ultrarslanoglu Core Team
Date: 2026-01-03
"""

import json
import logging
from datetime import datetime
from typing import Dict, List

import pymongo
from pymongo import MongoClient

# Logging setup
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class GalatasarayResearchDB:
    """
    MongoDB database manager for Galatasaray global supporters research
    """

    def __init__(
        self,
        connection_string: str = "mongodb://admin:ultrarslanoglu2025@localhost:27017/ultrarslanoglu?authSource=admin",
    ):
        """
        Initialize MongoDB connection

        Args:
            connection_string: MongoDB connection URI
        """
        try:
            self.client = MongoClient(connection_string)
            self.db = self.client["ultrarslanoglu"]
            self.supporters = self.db["galatasaray_supporters"]
            self.clubs = self.db["galatasaray_supporter_clubs"]
            self.statistics = self.db["galatasaray_statistics"]
            self.events = self.db["galatasaray_events"]
            self.influencers = self.db["galatasaray_influencers"]

            logger.info("✅ MongoDB connection established successfully")
            self._create_indexes()
        except Exception as e:
            logger.error(f"❌ Failed to connect to MongoDB: {e}")
            raise

    def _create_indexes(self):
        """Create necessary indexes for efficient querying"""
        try:
            # Supporters collection indexes
            self.supporters.create_index("country")
            self.supporters.create_index("city")
            self.supporters.create_index("engagement_level")
            self.supporters.create_index([("supporter_since", pymongo.ASCENDING)])

            # Clubs collection indexes
            self.clubs.create_index("country")
            self.clubs.create_index("city")
            self.clubs.create_index("activity_level")

            # Events collection indexes
            self.events.create_index("date")
            self.events.create_index("country")
            self.events.create_index("event_type")

            logger.info("✅ Database indexes created")
        except Exception as e:
            logger.warning(f"⚠️  Index creation warning: {e}")

    def add_supporter(self, supporter_data: Dict) -> str:
        """
        Add a new supporter to the database

        Args:
            supporter_data: Dictionary with supporter information

        Returns:
            Inserted document ID
        """
        try:
            supporter_data["created_at"] = datetime.now()
            supporter_data["updated_at"] = datetime.now()

            result = self.supporters.insert_one(supporter_data)
            logger.info(f"✅ Supporter added: {result.inserted_id}")
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"❌ Error adding supporter: {e}")
            raise

    def add_club(self, club_data: Dict) -> str:
        """
        Add a new regional supporter club

        Args:
            club_data: Dictionary with club information

        Returns:
            Inserted document ID
        """
        try:
            club_data["created_at"] = datetime.now()
            club_data["updated_at"] = datetime.now()

            result = self.clubs.insert_one(club_data)
            logger.info(f"✅ Club added: {result.inserted_id}")
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"❌ Error adding club: {e}")
            raise

    def get_supporters_by_country(self, country: str) -> List[Dict]:
        """
        Retrieve all supporters from a specific country

        Args:
            country: Country name

        Returns:
            List of supporter documents
        """
        try:
            supporters = list(self.supporters.find({"country": country}))
            logger.info(f"✅ Found {len(supporters)} supporters in {country}")
            return supporters
        except Exception as e:
            logger.error(f"❌ Error retrieving supporters: {e}")
            raise

    def get_global_statistics(self) -> Dict:
        """
        Get comprehensive global statistics

        Returns:
            Dictionary with global statistics
        """
        try:
            total_supporters = self.supporters.count_documents({})
            total_clubs = self.clubs.count_documents({})

            # Country distribution
            country_stats = list(
                self.supporters.aggregate(
                    [
                        {"$group": {"_id": "$country", "count": {"$sum": 1}}},
                        {"$sort": {"count": -1}},
                    ]
                )
            )

            # Engagement distribution
            engagement_stats = list(
                self.supporters.aggregate(
                    [{"$group": {"_id": "$engagement_level", "count": {"$sum": 1}}}]
                )
            )

            # Supporter type distribution
            type_stats = list(
                self.supporters.aggregate(
                    [{"$group": {"_id": "$supporter_type", "count": {"$sum": 1}}}]
                )
            )

            stats = {
                "timestamp": datetime.now(),
                "total_supporters": total_supporters,
                "total_clubs": total_clubs,
                "country_distribution": country_stats,
                "engagement_distribution": engagement_stats,
                "supporter_type_distribution": type_stats,
            }

            logger.info(
                f"✅ Global statistics retrieved: {total_supporters} supporters, {total_clubs} clubs"
            )
            return stats
        except Exception as e:
            logger.error(f"❌ Error getting statistics: {e}")
            raise

    def add_event(self, event_data: Dict) -> str:
        """
        Add a major global event

        Args:
            event_data: Dictionary with event information

        Returns:
            Inserted document ID
        """
        try:
            event_data["created_at"] = datetime.now()
            result = self.events.insert_one(event_data)
            logger.info(f"✅ Event added: {result.inserted_id}")
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"❌ Error adding event: {e}")
            raise

    def search_supporters(self, query: Dict) -> List[Dict]:
        """
        Advanced search on supporters collection

        Args:
            query: MongoDB query dictionary

        Returns:
            List of matching supporters
        """
        try:
            results = list(self.supporters.find(query))
            logger.info(f"✅ Search returned {len(results)} results")
            return results
        except Exception as e:
            logger.error(f"❌ Error searching supporters: {e}")
            raise

    def export_statistics_to_json(self, filename: str = "galatasaray_stats.json"):
        """
        Export statistics to JSON file

        Args:
            filename: Output filename
        """
        try:
            stats = self.get_global_statistics()
            stats["timestamp"] = str(stats["timestamp"])

            with open(filename, "w", encoding="utf-8") as f:
                json.dump(stats, f, ensure_ascii=False, indent=2)

            logger.info(f"✅ Statistics exported to {filename}")
        except Exception as e:
            logger.error(f"❌ Error exporting statistics: {e}")
            raise

    def generate_report(self) -> str:
        """
        Generate a comprehensive research report

        Returns:
            Formatted report string
        """
        try:
            stats = self.get_global_statistics()

            report = f"""
╔════════════════════════════════════════════════════════════════╗
║     GALATASARAY GLOBAL SUPPORTERS RESEARCH - REPORT            ║
║     Report Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
╚════════════════════════════════════════════════════════════════╝

📊 OVERALL STATISTICS
─────────────────────────────────────────────────────────────────
Total Supporters in Database: {stats["total_supporters"]:,}
Total Regional Clubs: {stats["total_clubs"]:,}

🌍 TOP 10 COUNTRIES BY SUPPORTER COUNT
─────────────────────────────────────────────────────────────────
"""
            for i, country in enumerate(stats["country_distribution"][:10], 1):
                report += (
                    f"{i:2d}. {country['_id']:20s} {country['count']:>8,} supporters\n"
                )

            report += """
📈 ENGAGEMENT LEVEL DISTRIBUTION
─────────────────────────────────────────────────────────────────
"""
            for engagement in stats["engagement_distribution"]:
                report += (
                    f"  {engagement['_id']:15s} {engagement['count']:>6} supporters\n"
                )

            report += """
🎯 SUPPORTER TYPE DISTRIBUTION
─────────────────────────────────────────────────────────────────
"""
            for stype in stats["supporter_type_distribution"]:
                report += f"  {stype['_id']:15s} {stype['count']:>6} supporters\n"

            report += f"""
════════════════════════════════════════════════════════════════
Report generated on: {datetime.now()}
Data source: MongoDB Collection
Status: Active Research Project
════════════════════════════════════════════════════════════════
"""

            logger.info("✅ Report generated successfully")
            return report
        except Exception as e:
            logger.error(f"❌ Error generating report: {e}")
            raise

    def close(self):
        """Close database connection"""
        try:
            self.client.close()
            logger.info("✅ MongoDB connection closed")
        except Exception as e:
            logger.error(f"❌ Error closing connection: {e}")


def main():
    """Main function for testing"""

    # Initialize database
    db = GalatasarayResearchDB()

    try:
        # Sample data for testing
        sample_supporter = {
            "name": "Ahmet Yılmaz",
            "age": 35,
            "gender": "M",
            "country": "Turkey",
            "city": "Istanbul",
            "supporter_since": datetime(2005, 1, 1),
            "supporter_type": "Active",
            "support_method": ["Stadium", "Community"],
            "engagement_level": "High",
            "favorite_player": "Hakan Şükür",
            "favorite_sport": "Football",
        }

        sample_club = {
            "name": "Istanbul Galatasaraylıları",
            "country": "Turkey",
            "city": "Istanbul",
            "founded_year": 2000,
            "estimated_members": 5000,
            "activity_level": "High",
            "events_per_month": 2,
        }

        # Add sample data
        supporter_id = db.add_supporter(sample_supporter)
        club_id = db.add_club(sample_club)

        # Get statistics
        stats = db.get_global_statistics()

        # Generate and print report
        report = db.generate_report()
        print(report)

        # Export statistics
        db.export_statistics_to_json()

    finally:
        db.close()


if __name__ == "__main__":
    main()
