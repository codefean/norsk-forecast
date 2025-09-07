import geopandas as gpd
import pandas as pd
from shapely.geometry import Point

# === 1. Load weather stations CSV ===
stations_df = pd.read_csv("/Users/seanfagan/Downloads/weather_stations.csv")

# Convert to GeoDataFrame
stations_gdf = gpd.GeoDataFrame(
    stations_df,
    geometry=gpd.points_from_xy(stations_df.longitude, stations_df.latitude),
    crs="EPSG:4326"  # WGS84
)

# === 2. Load glaciers GeoJSON ===
glaciers_gdf = gpd.read_file("/Users/seanfagan/Downloads/scandi_glaciers3.geojson")

# Extract glacier names from the correct column
if "glac_names" not in glaciers_gdf.columns:
    raise KeyError("Could not find 'glac_names' column in glaciers GeoJSON")

# Use glacier centroids for nearest calculations
glaciers_gdf["centroid"] = glaciers_gdf.geometry.centroid
glaciers_gdf = glaciers_gdf.set_geometry("centroid")

# === 3. Reproject to a metric CRS (UTM Zone 33N works for Scandinavia) ===
stations_gdf = stations_gdf.to_crs(epsg=32633)
glaciers_gdf = glaciers_gdf.to_crs(epsg=32633)

# === 4. Find nearest glacier for each station ===
nearest = gpd.sjoin_nearest(
    stations_gdf,
    glaciers_gdf,
    how="left",
    distance_col="distance_to_glacier_m"
)

# Convert meters to kilometers
nearest["distance_to_glacier_km"] = nearest["distance_to_glacier_m"] / 1000

# Rename glacier name column for clarity
nearest.rename(columns={"glac_names": "closest_glacier"}, inplace=True)

# === 5. Save updated CSV ===
final_df = nearest.drop(columns=["geometry"])
final_df.to_csv("weather_stations_with_glaciers.csv", index=False)

print("✅ Exported weather_stations_with_glaciers.csv")
print(final_df[["id", "name", "closest_glacier", "distance_to_glacier_km"]].head())
