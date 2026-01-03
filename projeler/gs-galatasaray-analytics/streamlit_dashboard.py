#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Galatasaray Analytics Dashboard - Streamlit
Canlı oyuncu ve klub bilgileri
"""

import streamlit as st
import requests
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime
from PIL import Image
import json

# Page config
st.set_page_config(
    page_title="Galatasaray Analytics",
    page_icon="🟡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
    /* Galatasaray colors */
    :root {
        --primary: #DC143C;
        --secondary: #FFD700;
        --dark: #000000;
    }
    
    .header {
        text-align: center;
        color: #DC143C;
        margin-bottom: 2rem;
    }
    
    .stat-card {
        background: linear-gradient(135deg, #DC143C 0%, #8B0000 100%);
        color: white;
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        margin: 10px 0;
    }
    
    .stat-value {
        font-size: 32px;
        font-weight: bold;
        margin: 10px 0;
    }
    
    .stat-label {
        font-size: 14px;
        opacity: 0.8;
    }
</style>
""", unsafe_allow_html=True)

# API Base URL
API_URL = "http://localhost:5002"

# Sidebar
st.sidebar.title("⚽ Galatasaray Analytics")
page = st.sidebar.radio(
    "Sayfaları Seç",
    ["🏠 Dashboard", "👥 Oyuncular", "🏆 Kulüp Bilgileri", "📊 İstatistikler", "💬 Sosyal Medya"]
)

# Helper functions
@st.cache_data(ttl=3600)
def fetch_club_info():
    """Kulüp bilgisi çek"""
    try:
        response = requests.get(f"{API_URL}/api/club/info")
        if response.status_code == 200:
            return response.json()['club']
    except:
        pass
    return None

@st.cache_data(ttl=3600)
def fetch_players():
    """Oyuncuları çek"""
    try:
        response = requests.get(f"{API_URL}/api/players")
        if response.status_code == 200:
            return response.json()['players']
    except:
        pass
    return []

@st.cache_data(ttl=3600)
def fetch_squad_stats():
    """Kadro istatistikleri çek"""
    try:
        response = requests.get(f"{API_URL}/api/squad/stats")
        if response.status_code == 200:
            return response.json()['squad_stats']
    except:
        pass
    return None

@st.cache_data(ttl=3600)
def fetch_top_scorers():
    """En çok gol atan"""
    try:
        response = requests.get(f"{API_URL}/api/squad/top-scorers?limit=10")
        if response.status_code == 200:
            return response.json()['top_scorers']
    except:
        pass
    return []

@st.cache_data(ttl=3600)
def fetch_season_stats():
    """Sezon istatistikleri çek"""
    try:
        response = requests.get(f"{API_URL}/api/club/season-stats")
        if response.status_code == 200:
            return response.json()['season_stats']
    except:
        pass
    return None

@st.cache_data(ttl=3600)
def fetch_recent_matches():
    """Son maçlar çek"""
    try:
        response = requests.get(f"{API_URL}/api/club/recent-matches")
        if response.status_code == 200:
            return response.json()['matches']
    except:
        pass
    return []

@st.cache_data(ttl=3600)
def fetch_insights():
    """İçgörüleri çek"""
    try:
        response = requests.get(f"{API_URL}/api/insights?days=7")
        if response.status_code == 200:
            return response.json()
    except:
        pass
    return None

# ======================== DASHBOARD ========================
if page == "🏠 Dashboard":
    st.markdown("# 🟡 Galatasaray Analytics Dashboard")
    
    col1, col2, col3, col4 = st.columns(4)
    
    club_info = fetch_club_info()
    squad_stats = fetch_squad_stats()
    season_stats = fetch_season_stats()
    
    if squad_stats:
        with col1:
            st.markdown(f"""
            <div class="stat-card">
                <div class="stat-label">Toplam Oyuncu</div>
                <div class="stat-value">{squad_stats.get('total_players', 0)}</div>
            </div>
            """, unsafe_allow_html=True)
        
        with col2:
            st.markdown(f"""
            <div class="stat-card">
                <div class="stat-label">Attığımız Gol</div>
                <div class="stat-value">{squad_stats.get('total_goals', 0)}</div>
            </div>
            """, unsafe_allow_html=True)
        
        with col3:
            st.markdown(f"""
            <div class="stat-card">
                <div class="stat-label">Yediğimiz Gol</div>
                <div class="stat-value">{season_stats.get('goals_against', 0) if season_stats else 0}</div>
            </div>
            """, unsafe_allow_html=True)
        
        with col4:
            st.markdown(f"""
            <div class="stat-card">
                <div class="stat-label">Ortalama Yaş</div>
                <div class="stat-value">{squad_stats.get('average_age', 0)}</div>
            </div>
            """, unsafe_allow_html=True)
    
    # En çok gol atan
    st.subheader("⚽ Sezonun En Çok Gol Atanları")
    top_scorers = fetch_top_scorers()
    
    if top_scorers:
        df_scorers = pd.DataFrame(top_scorers)
        
        col1, col2 = st.columns([2, 1])
        
        with col1:
            fig = px.bar(
                df_scorers,
                x='name',
                y='goals',
                title="En Çok Gol Atanlar",
                labels={'name': 'Oyuncu', 'goals': 'Gol'},
                color='goals',
                color_continuous_scale='Reds',
                text='goals'
            )
            fig.update_traces(textposition='outside')
            st.plotly_chart(fig, use_container_width=True)
        
        with col2:
            st.dataframe(
                df_scorers[['rank', 'name', 'goals', 'assists', 'position']],
                use_container_width=True,
                hide_index=True
            )
    
    # Son maçlar
    st.subheader("📅 Son Maçlar")
    recent_matches = fetch_recent_matches()
    
    if recent_matches:
        for match in recent_matches[:3]:
            col1, col2, col3 = st.columns([1, 2, 1])
            
            with col1:
                st.write(match['date'])
            
            with col2:
                result_color = "🟢" if match['status'] == 'W' else "🟡" if match['status'] == 'D' else "🔴"
                st.write(f"{result_color} **{match['opponent']}** {match['result']}")
            
            with col3:
                st.write(match['competition'])

# ======================== OYUNCULAR ========================
elif page == "👥 Oyuncular":
    st.markdown("# 👥 Galatasaray Kadrosu")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        position_filter = st.selectbox(
            "Pozisyon Filtrele",
            ["Tümü", "GK", "CB", "LB", "RB", "CM", "CAM", "CDM", "LW", "RW", "ST", "CF"]
        )
    
    with col2:
        sort_by = st.selectbox(
            "Sırala",
            ["Ad", "Gol", "Asist", "Forma Numarası"],
            index=0
        )
    
    with col3:
        st.write("")  # Boşluk
    
    # Oyuncuları çek
    players = fetch_players()
    
    if players:
        # Filtreleme
        if position_filter != "Tümü":
            players = [p for p in players if p['position'] == position_filter]
        
        # Sıralama
        if sort_by == "Gol":
            players = sorted(players, key=lambda p: p['goals'], reverse=True)
        elif sort_by == "Asist":
            players = sorted(players, key=lambda p: p['assists'], reverse=True)
        elif sort_by == "Forma Numarası":
            players = sorted(players, key=lambda p: p['number'])
        else:
            players = sorted(players, key=lambda p: p['name'])
        
        # Tablo
        df_players = pd.DataFrame([
            {
                "Forma": p['number'],
                "Ad": p['name'],
                "Pozisyon": p['position'],
                "Milliyet": p['nationality'],
                "Yaş": 2025 - int(p['birth_date'][:4]),
                "Gol": p['goals'],
                "Asist": p['assists'],
                "Boy": f"{p['height_cm']}cm"
            }
            for p in players
        ])
        
        st.dataframe(df_players, use_container_width=True, hide_index=True)

# ======================== KULÜP BİLGİLERİ ========================
elif page == "🏆 Kulüp Bilgileri":
    st.markdown("# 🏆 Galatasaray Spor Kulübü")
    
    club_info = fetch_club_info()
    
    if club_info:
        col1, col2 = st.columns([2, 1])
        
        with col1:
            st.subheader("Kulüp Bilgileri")
            
            info_data = {
                "Kuruluş Yılı": club_info['founded'],
                "Ülke": club_info['country'],
                "Şehir": club_info['city'],
                "Stadyum": club_info['stadium'],
                "Stadyum Kapasitesi": f"{club_info['stadium_capacity']:,}",
                "Teknik Direktör": club_info['coach'],
                "Başkan": club_info['president']
            }
            
            for key, value in info_data.items():
                st.write(f"**{key}:** {value}")
        
        with col2:
            st.subheader("Sosyal Medya")
            
            social_data = {
                "Instagram": f"{club_info['instagram_followers']:,}",
                "Twitter": f"{club_info['twitter_followers']:,}",
                "Facebook": f"{club_info['facebook_followers']:,}"
            }
            
            for platform, followers in social_data.items():
                st.write(f"**{platform}:** {followers} takipçi")
        
        # Başarılar
        honours = {
            "Şampiyonluk": club_info['league_titles'],
            "Kupa": club_info['cup_titles'],
            "Avrupa Şampiyonluğu": club_info['european_titles']
        }
        
        st.subheader("🏅 Şampiyonluklar")
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.metric("Lig Şampiyonluğu", honours["Şampiyonluk"])
        
        with col2:
            st.metric("Kupa", honours["Kupa"])
        
        with col3:
            st.metric("Avrupa Şampiyonluğu", honours["Avrupa Şampiyonluğu"])

# ======================== İSTATİSTİKLER ========================
elif page == "📊 İstatistikler":
    st.markdown("# 📊 Sezon İstatistikleri")
    
    season_stats = fetch_season_stats()
    squad_stats = fetch_squad_stats()
    
    if season_stats:
        col1, col2, col3, col4, col5 = st.columns(5)
        
        with col1:
            st.metric("Konum", season_stats['position'])
        
        with col2:
            st.metric("Oyunu Maç", season_stats['played'])
        
        with col3:
            st.metric("Galibiyet", season_stats['wins'])
        
        with col4:
            st.metric("Beraberlik", season_stats['draws'])
        
        with col5:
            st.metric("Mağlubiyet", season_stats['losses'])
        
        st.divider()
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("Gol İstatistikleri")
            
            goals_data = {
                "Attığımız": [season_stats['goals_for']],
                "Yediğimiz": [season_stats['goals_against']]
            }
            
            fig = go.Figure(data=[
                go.Bar(x=list(goals_data.keys()), y=[v[0] for v in goals_data.values()],
                       marker_color=['#DC143C', '#8B0000'])
            ])
            
            fig.update_layout(title="Gol Farkı", xaxis_title="", yaxis_title="Gol Sayısı")
            st.plotly_chart(fig, use_container_width=True)
        
        with col2:
            st.subheader("Kazanma Yüzdesi")
            
            win_pct = (season_stats['wins'] / season_stats['played'] * 100) if season_stats['played'] > 0 else 0
            
            fig = go.Figure(data=[
                go.Pie(labels=['Galibiyet', 'Diğer'], 
                       values=[win_pct, 100-win_pct],
                       marker_colors=['#DC143C', '#CCCCCC'])
            ])
            
            fig.update_layout(title=f"Kazanma Oranı: %{win_pct:.1f}")
            st.plotly_chart(fig, use_container_width=True)
        
        # Kadro İstatistikleri
        if squad_stats:
            st.subheader("📋 Kadro Yapısı")
            
            squad_structure = {
                "Kaleci": squad_stats['goalkeepers'],
                "Savunmacı": squad_stats['defenders'],
                "Ortasaha": squad_stats['midfielders'],
                "Forvet": squad_stats['forwards']
            }
            
            fig = go.Figure(data=[
                go.Bar(x=list(squad_structure.keys()), 
                       y=list(squad_structure.values()),
                       marker_color='#DC143C',
                       text=list(squad_structure.values()),
                       textposition='outside')
            ])
            
            fig.update_layout(title="Pozisyona Göre Oyuncu Dağılımı", 
                            xaxis_title="", yaxis_title="Oyuncu Sayısı")
            st.plotly_chart(fig, use_container_width=True)

# ======================== SOSYAL MEDYA ========================
elif page == "💬 Sosyal Medya":
    st.markdown("# 💬 Sosyal Medya Analizi")
    
    insights = fetch_insights()
    
    if insights:
        st.subheader("📊 Sentiment Analizi")
        
        sentiment_dist = insights['sentiment_distribution']
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.metric("😊 Pozitif", sentiment_dist['positive'])
        
        with col2:
            st.metric("😟 Negatif", sentiment_dist['negative'])
        
        with col3:
            st.metric("⚖️ Nötr", sentiment_dist['neutral'])
        
        # Sentiment grafiği
        fig = go.Figure(data=[
            go.Pie(labels=['Pozitif', 'Negatif', 'Nötr'],
                   values=[sentiment_dist['positive'], sentiment_dist['negative'], sentiment_dist['neutral']],
                   marker_colors=['#DC143C', '#FFD700', '#CCCCCC'])
        ])
        
        fig.update_layout(title="Sentiment Dağılımı")
        st.plotly_chart(fig, use_container_width=True)
        
        # İçgörüler
        st.subheader("🔍 İçgörüler")
        for insight in insights['insights']:
            st.info(insight)

# Footer
st.divider()
st.markdown("""
<div style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">
    <p>🟡 Galatasaray Analytics | <em>Real-Time Data Analysis</em></p>
    <p>Last Updated: {}  |  Powered by Streamlit & Flask API</p>
</div>
""".format(datetime.now().strftime("%Y-%m-%d %H:%M")), unsafe_allow_html=True)
