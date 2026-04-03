import pandas as pd
import os

folder = "data/processed_csv"

all_data = []

for file in os.listdir(folder):
    if file.endswith(".csv"):
        path = os.path.join(folder, file)
        df = pd.read_csv(path)

        city = file.replace(".csv", "")
        df["city"] = city

        all_data.append(df)

final_df = pd.concat(all_data, ignore_index=True)

final_df.to_csv("data/final_dataset.csv", index=False)

print("Merged all cities!")