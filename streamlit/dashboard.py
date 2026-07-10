import os
import dash
from dash import dcc, html, dash_table
import plotly.graph_objects as go
import pandas as pd

# Load Pink Morsel data from CSV (path relative to this script)
_here = os.path.dirname(os.path.abspath(__file__))
df = pd.read_csv(os.path.join(_here, "pink_morsel_data.csv"))
df["revenue"] = df["price"] * df["sales"]

app = dash.Dash(__name__)

app.layout = html.Div(
    style={"fontFamily": "Segoe UI, sans-serif", "backgroundColor": "#f7f8fa", "minHeight": "100vh", "padding": "24px"},
    children=[
        html.H1(
            "Pink Morsel Dashboard",
            style={"textAlign": "center", "color": "#1f2328", "marginBottom": "8px"},
        ),
        html.P(
            "Annual price, sales volume, and revenue overview",
            style={"textAlign": "center", "color": "#57606a", "marginBottom": "32px"},
        ),

        # KPI Cards
        html.Div(
            style={"display": "flex", "gap": "16px", "marginBottom": "32px", "justifyContent": "center"},
            children=[
                html.Div(
                    style={
                        "background": "#ffffff", "border": "1px solid #e5e7eb",
                        "borderRadius": "8px", "padding": "20px 32px", "textAlign": "center", "flex": "1", "maxWidth": "220px",
                    },
                    children=[
                        html.P("Latest Price", style={"color": "#57606a", "margin": "0 0 4px 0", "fontSize": "13px"}),
                        html.H2(f"${df['price'].iloc[-1]:.2f}", style={"color": "#3b82d4", "margin": "0"}),
                    ],
                ),
                html.Div(
                    style={
                        "background": "#ffffff", "border": "1px solid #e5e7eb",
                        "borderRadius": "8px", "padding": "20px 32px", "textAlign": "center", "flex": "1", "maxWidth": "220px",
                    },
                    children=[
                        html.P("Latest Sales", style={"color": "#57606a", "margin": "0 0 4px 0", "fontSize": "13px"}),
                        html.H2(f"{df['sales'].iloc[-1]:,} units", style={"color": "#7c5cd8", "margin": "0"}),
                    ],
                ),
                html.Div(
                    style={
                        "background": "#ffffff", "border": "1px solid #e5e7eb",
                        "borderRadius": "8px", "padding": "20px 32px", "textAlign": "center", "flex": "1", "maxWidth": "220px",
                    },
                    children=[
                        html.P("Latest Revenue", style={"color": "#57606a", "margin": "0 0 4px 0", "fontSize": "13px"}),
                        html.H2(f"${df['revenue'].iloc[-1]:,.0f}", style={"color": "#1f2328", "margin": "0"}),
                    ],
                ),
            ],
        ),

        # Charts Row
        html.Div(
            style={"display": "flex", "gap": "16px", "marginBottom": "32px"},
            children=[
                html.Div(
                    style={"flex": "1", "background": "#ffffff", "border": "1px solid #e5e7eb", "borderRadius": "8px", "padding": "16px"},
                    children=[
                        dcc.Graph(
                            id="price-chart",
                            figure=go.Figure(
                                data=[
                                    go.Scatter(
                                        x=df["year"], y=df["price"],
                                        mode="lines+markers",
                                        name="Price ($)",
                                        line={"color": "#3b82d4", "width": 2},
                                        marker={"size": 7},
                                    )
                                ],
                                layout=go.Layout(
                                    title="Price Over Time",
                                    xaxis={"title": "Year", "tickmode": "linear"},
                                    yaxis={"title": "Price (USD)", "tickprefix": "$"},
                                    plot_bgcolor="#ffffff",
                                    paper_bgcolor="#ffffff",
                                    font={"family": "Segoe UI, sans-serif", "color": "#1f2328"},
                                    margin={"t": 40, "b": 40, "l": 50, "r": 20},
                                ),
                            ),
                            config={"displayModeBar": False},
                        )
                    ],
                ),
                html.Div(
                    style={"flex": "1", "background": "#ffffff", "border": "1px solid #e5e7eb", "borderRadius": "8px", "padding": "16px"},
                    children=[
                        dcc.Graph(
                            id="sales-chart",
                            figure=go.Figure(
                                data=[
                                    go.Bar(
                                        x=df["year"], y=df["sales"],
                                        name="Sales (units)",
                                        marker_color="#7c5cd8",
                                    )
                                ],
                                layout=go.Layout(
                                    title="Sales Volume Over Time",
                                    xaxis={"title": "Year", "tickmode": "linear"},
                                    yaxis={"title": "Units Sold"},
                                    plot_bgcolor="#ffffff",
                                    paper_bgcolor="#ffffff",
                                    font={"family": "Segoe UI, sans-serif", "color": "#1f2328"},
                                    margin={"t": 40, "b": 40, "l": 50, "r": 20},
                                ),
                            ),
                            config={"displayModeBar": False},
                        )
                    ],
                ),
            ],
        ),

        # Revenue chart
        html.Div(
            style={"background": "#ffffff", "border": "1px solid #e5e7eb", "borderRadius": "8px", "padding": "16px", "marginBottom": "32px"},
            children=[
                dcc.Graph(
                    id="revenue-chart",
                    figure=go.Figure(
                        data=[
                            go.Scatter(
                                x=df["year"], y=df["revenue"],
                                mode="lines+markers",
                                fill="tozeroy",
                                name="Revenue ($)",
                                line={"color": "#1f2328", "width": 2},
                                marker={"size": 7},
                                fillcolor="rgba(59,130,212,0.1)",
                            )
                        ],
                        layout=go.Layout(
                            title="Revenue Over Time (Price × Sales)",
                            xaxis={"title": "Year", "tickmode": "linear"},
                            yaxis={"title": "Revenue (USD)", "tickprefix": "$"},
                            plot_bgcolor="#ffffff",
                            paper_bgcolor="#ffffff",
                            font={"family": "Segoe UI, sans-serif", "color": "#1f2328"},
                            margin={"t": 40, "b": 40, "l": 60, "r": 20},
                        ),
                    ),
                    config={"displayModeBar": False},
                )
            ],
        ),

        # Data Table
        html.Div(
            style={"background": "#ffffff", "border": "1px solid #e5e7eb", "borderRadius": "8px", "padding": "16px"},
            children=[
                html.H3("Raw Data", style={"color": "#1f2328", "marginTop": "0", "marginBottom": "12px"}),
                dash_table.DataTable(
                    data=df.assign(
                        price=df["price"].map("${:.2f}".format),
                        sales=df["sales"].map("{:,}".format),
                        revenue=df["revenue"].map("${:,.0f}".format),
                    ).to_dict("records"),
                    columns=[
                        {"name": "Year", "id": "year"},
                        {"name": "Price (USD)", "id": "price"},
                        {"name": "Sales (units)", "id": "sales"},
                        {"name": "Revenue (USD)", "id": "revenue"},
                    ],
                    style_table={"overflowX": "auto"},
                    style_header={
                        "backgroundColor": "#f7f8fa",
                        "fontWeight": "600",
                        "color": "#1f2328",
                        "border": "1px solid #e5e7eb",
                    },
                    style_cell={
                        "textAlign": "center",
                        "padding": "10px 16px",
                        "color": "#1f2328",
                        "border": "1px solid #e5e7eb",
                        "fontFamily": "Segoe UI, sans-serif",
                    },
                    style_data_conditional=[
                        {"if": {"row_index": "odd"}, "backgroundColor": "#f7f8fa"}
                    ],
                ),
            ],
        ),
    ],
)

if __name__ == "__main__":
    app.run(debug=True)
