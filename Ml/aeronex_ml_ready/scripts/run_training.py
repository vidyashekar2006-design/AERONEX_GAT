from aeronex_ml.training.train_all import train
import argparse
ap=argparse.ArgumentParser(); ap.add_argument('--data',default='data/raw/aeronex_engine_telemetry.csv'); ap.add_argument('--out',default='artifacts'); train(ap.parse_args())
