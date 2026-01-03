#!/usr/bin/env python3
"""
Galatasaray Research Database - CLI Tool
Manage and populate the global supporters research database
"""

import json
import logging
from datetime import datetime

import click
from galatasaray_research_db import GalatasarayResearchDB

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@click.group()
def cli():
    """Galatasaray Global Supporters Research Database CLI"""
    pass


@cli.command()
@click.option("--name", required=True, help="Supporter name")
@click.option("--age", type=int, required=True, help="Supporter age")
@click.option("--gender", type=click.Choice(["M", "F", "Other"]), required=True)
@click.option("--country", required=True, help="Country")
@click.option("--city", required=True, help="City")
@click.option(
    "--engagement", type=click.Choice(["Low", "Medium", "High"]), default="Medium"
)
@click.option(
    "--supporter-type",
    type=click.Choice(["Casual", "Active", "Hardcore"]),
    default="Active",
)
def add_supporter(name, age, gender, country, city, engagement, supporter_type):
    """Add a new supporter to the database"""
    try:
        db = GalatasarayResearchDB()

        supporter_data = {
            "name": name,
            "age": age,
            "gender": gender,
            "country": country,
            "city": city,
            "engagement_level": engagement,
            "supporter_type": supporter_type,
            "supporter_since": datetime.now(),
        }

        supporter_id = db.add_supporter(supporter_data)
        click.echo(f"✅ Supporter added with ID: {supporter_id}")
        db.close()
    except Exception as e:
        click.echo(f"❌ Error: {e}", err=True)


@cli.command()
@click.option("--name", required=True, help="Club name")
@click.option("--country", required=True, help="Country")
@click.option("--city", required=True, help="City")
@click.option("--members", type=int, default=0, help="Estimated members")
@click.option("--founded", type=int, required=True, help="Founded year")
def add_club(name, country, city, members, founded):
    """Add a new supporter club"""
    try:
        db = GalatasarayResearchDB()

        club_data = {
            "name": name,
            "country": country,
            "city": city,
            "founded_year": founded,
            "estimated_members": members,
            "activity_level": "Active" if members > 100 else "Developing",
        }

        club_id = db.add_club(club_data)
        click.echo(f"✅ Club added with ID: {club_id}")
        db.close()
    except Exception as e:
        click.echo(f"❌ Error: {e}", err=True)


@cli.command()
def stats():
    """Display global statistics"""
    try:
        db = GalatasarayResearchDB()
        report = db.generate_report()
        click.echo(report)
        db.close()
    except Exception as e:
        click.echo(f"❌ Error: {e}", err=True)


@cli.command()
@click.option("--country", required=True, help="Country name")
def supporters_by_country(country):
    """List all supporters from a country"""
    try:
        db = GalatasarayResearchDB()
        supporters = db.get_supporters_by_country(country)

        if not supporters:
            click.echo(f"No supporters found in {country}")
        else:
            click.echo(f"\n📍 Supporters in {country} ({len(supporters)} total):\n")
            for i, supporter in enumerate(supporters, 1):
                click.echo(
                    f"{i}. {supporter.get('name', 'Unknown')} ({supporter.get('age', '?')} years old)"
                )
                click.echo(f"   City: {supporter.get('city', 'N/A')}")
                click.echo(f"   Engagement: {supporter.get('engagement_level', 'N/A')}")
                click.echo()

        db.close()
    except Exception as e:
        click.echo(f"❌ Error: {e}", err=True)


@cli.command()
@click.option("--output", default="galatasaray_stats.json", help="Output filename")
def export(output):
    """Export statistics to JSON"""
    try:
        db = GalatasarayResearchDB()
        db.export_statistics_to_json(output)
        click.echo(f"✅ Statistics exported to {output}")
        db.close()
    except Exception as e:
        click.echo(f"❌ Error: {e}", err=True)


@cli.command()
@click.option(
    "--file", required=True, type=click.File("r"), help="JSON file with supporter data"
)
def import_data(file):
    """Import supporters from JSON file"""
    try:
        db = GalatasarayResearchDB()
        data = json.load(file)

        if isinstance(data, list):
            count = 0
            for supporter_data in data:
                try:
                    db.add_supporter(supporter_data)
                    count += 1
                except Exception as e:
                    logger.warning(f"Failed to add supporter: {e}")

            click.echo(f"✅ Imported {count} supporters successfully")

        db.close()
    except Exception as e:
        click.echo(f"❌ Error: {e}", err=True)


@cli.command()
def init_db():
    """Initialize database with sample data"""
    try:
        db = GalatasarayResearchDB()

        # Sample supporters
        sample_supporters = [
            {
                "name": "Ahmet Yılmaz",
                "age": 35,
                "gender": "M",
                "country": "Turkey",
                "city": "Istanbul",
                "supporter_type": "Hardcore",
                "engagement_level": "High",
                "supporter_since": datetime(2005, 1, 1),
            },
            {
                "name": "Müjde Demir",
                "age": 28,
                "gender": "F",
                "country": "Turkey",
                "city": "Ankara",
                "supporter_type": "Active",
                "engagement_level": "High",
                "supporter_since": datetime(2015, 6, 15),
            },
            {
                "name": "John Smith",
                "age": 42,
                "gender": "M",
                "country": "Germany",
                "city": "Berlin",
                "supporter_type": "Active",
                "engagement_level": "Medium",
                "supporter_since": datetime(2010, 3, 22),
            },
            {
                "name": "Pierre Dupont",
                "age": 55,
                "gender": "M",
                "country": "France",
                "city": "Paris",
                "supporter_type": "Casual",
                "engagement_level": "Low",
                "supporter_since": datetime(1995, 9, 1),
            },
        ]

        # Sample clubs
        sample_clubs = [
            {
                "name": "Istanbul Galatasaraylıları Derneği",
                "country": "Turkey",
                "city": "Istanbul",
                "founded_year": 1998,
                "estimated_members": 8000,
                "activity_level": "High",
                "events_per_month": 4,
            },
            {
                "name": "Berlin Galatasaray Taraftarları",
                "country": "Germany",
                "city": "Berlin",
                "founded_year": 2005,
                "estimated_members": 450,
                "activity_level": "High",
                "events_per_month": 2,
            },
            {
                "name": "Paris Galatasaray Supporter Club",
                "country": "France",
                "city": "Paris",
                "founded_year": 2008,
                "estimated_members": 320,
                "activity_level": "Medium",
                "events_per_month": 1,
            },
        ]

        # Add sample data
        click.echo("📝 Adding sample supporters...")
        for supporter in sample_supporters:
            db.add_supporter(supporter)

        click.echo("📝 Adding sample clubs...")
        for club in sample_clubs:
            db.add_club(club)

        # Display results
        click.echo("\n✅ Database initialized with sample data!\n")
        report = db.generate_report()
        click.echo(report)

        db.close()
    except Exception as e:
        click.echo(f"❌ Error: {e}", err=True)


@cli.command()
def health():
    """Check database connection health"""
    try:
        db = GalatasarayResearchDB()

        supporters_count = db.supporters.count_documents({})
        clubs_count = db.clubs.count_documents({})

        click.echo("\n✅ Database Health Check:\n")
        click.echo("  MongoDB Connection: ✅ CONNECTED")
        click.echo(f"  Supporters Collection: {supporters_count} documents")
        click.echo(f"  Clubs Collection: {clubs_count} documents")
        click.echo("  Status: ✅ HEALTHY\n")

        db.close()
    except Exception as e:
        click.echo("\n❌ Database Health Check:\n")
        click.echo("  Status: ❌ FAILED")
        click.echo(f"  Error: {e}\n")


if __name__ == "__main__":
    cli()
