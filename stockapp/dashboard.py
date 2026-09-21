import streamlit as st
import requests
import pandas as pd
import plotly.express as px

st.set_page_config(page_title="Trade Republic Broker Dashboard", layout="wide")

st.title("📊 Expert Broker Analytics Dashboard")
st.caption("Real-time technical tracking & conversational broker advice scaled to Euros (€)")

# User inputs custom tickers directly on the sidebar webpage interface
tickers = st.sidebar.text_input("Watchlist Tickers (Comma separated)", "AAPL,MSFT,TSLA,NVDA,SAP.DE")

if st.button("🔄 Execute Market Scan"):
    with st.spinner("Fetching market matrices and news streams..."):
        # Connects directly to your running Azure Function API endpoint!
        url = f"http://localhost:7071/api/analyze?tickers={tickers}"
        try:
            response = requests.get(url)
            data = response.json()
            
            if data["status"] == "success" and data["results"]:
                df = pd.DataFrame(data["results"])
                
                # 1. Summary High-Level Metrics Row
                buys = len(df[df['recommended_action'] == 'BUY'])
                sells = len(df[df['recommended_action'] == 'SELL'])
                
                col1, col2, col3 = st.columns(3)
                col1.metric("Total Assets Tracked", len(df))
                col2.metric("🟢 Active Buy Triggers", buys, delta=buys if buys > 0 else None)
                col3.metric("🔴 Active Sell Triggers", sells, delta=-sells if sells > 0 else None)
                
                st.markdown("---")
                
                # 2. Main Data Grid Layout Table
                st.subheader("🎯 Active Market Strategy Breakdown")
                
                # Style row colors based on recommendation actions using standard formatting
                def highlight_actions(row):
                    if row.recommended_action == 'BUY':
                        return ['background-color: #d4edda; color: #155724'] * len(row)
                    elif row.recommended_action == 'SELL':
                        return ['background-color: #f8d7da; color: #721c24'] * len(row)
                    return [''] * len(row)
                
                st.dataframe(df.style.apply(highlight_actions, axis=1), use_container_width=True)
                
                # 3. News Reader Section Cards
                st.markdown("---")
                st.subheader("📰 Connected Breaking Corporate News Stream")
                for _, row in df.iterrows():
                    with st.expander(f"Context For: {row['stock_name']} ({row['current_price']})"):
                        st.write(f"**Action:** {row['recommended_action']}")
                        st.write(f"**Broker Advice:** {row['broker_advice']}")
                        st.info(f"**Top Market Headline:** {row['breaking_news_reason']}")
            else:
                st.error("API returned empty array profiles.")
        except Exception as e:
            st.error(f"Could not reach backend API endpoint container: {str(e)}")
