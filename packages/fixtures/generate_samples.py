import json
import random
import xml.etree.ElementTree as ET
from pathlib import Path

# Target output directory
OUT_DIR = Path("packages/fixtures/samples")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Generate 1,000 synthetic sample events
random.seed(2026)

wallets = [f"syn_w_{i:04d}" for i in range(1, 101)]
ips = [f"198.18.{random.randint(0, 255)}.{random.randint(1, 254)}" for _ in range(30)]

events = []
for idx in range(1000):
    src_w = random.choice(wallets)
    dst_w = random.choice([w for w in wallets if w != src_w])
    src_ip = random.choice(ips)
    dst_ip = random.choice([ip for ip in ips if ip != src_ip])
    
    evt = {
        "event_id": f"syn_evt_{idx:06d}",
        "observed_at": f"2026-07-26T{idx // 3600:02d}:{(idx % 3600) // 60:02d}:{idx % 60:02d}.000Z",
        "txid": f"tx_{idx // 5:04d}",
        "input_wallet": src_w,
        "output_wallet": dst_w,
        "amount_sats": random.randint(10000, 5000000),
        "fee_sats": random.randint(500, 5000),
        "script_type": random.choice(["p2pkh", "p2sh", "p2wpkh"]),
        "src_ip": src_ip,
        "src_port": random.randint(1024, 65535),
        "dst_ip": dst_ip,
        "dst_port": 8333,
        "latency_ms": random.randint(10, 450),
        "peer_count_hint": random.randint(8, 32),
        "event_sequence": idx + 1
    }
    events.append(evt)

# 1. Save CSV sample (1,000 events)
csv_lines = ["event_id,observed_at,txid,input_wallet,output_wallet,amount_sats,fee_sats,script_type,src_ip,src_port,dst_ip,dst_port,latency_ms,peer_count_hint,event_sequence"]
for e in events:
    line = f"{e['event_id']},{e['observed_at']},{e['txid']},{e['input_wallet']},{e['output_wallet']},{e['amount_sats']},{e['fee_sats']},{e['script_type']},{e['src_ip']},{e['src_port']},{e['dst_ip']},{e['dst_port']},{e['latency_ms']},{e['peer_count_hint']},{e['event_sequence']}"
    csv_lines.append(line)

csv_path = OUT_DIR / "sample_events_1000.csv"
csv_path.write_text("\n".join(csv_lines), encoding="utf-8")
print(f"Generated {csv_path}")

# 2. Save JSON sample (500 events)
json_data = {
    "data_classification": "SYNTHETIC_ONLY",
    "seed": 2026,
    "event_count": 500,
    "events": events[:500]
}
json_path = OUT_DIR / "sample_events_500.json"
json_path.write_text(json.dumps(json_data, indent=2), encoding="utf-8")
print(f"Generated {json_path}")

# 3. Save XML sample (250 events)
root = ET.Element("dataset", classification="SYNTHETIC_ONLY", seed="2026")
events_elem = ET.SubElement(root, "events")

for e in events[:250]:
    evt_elem = ET.SubElement(events_elem, "event", id=e["event_id"])
    for k, v in e.items():
        sub = ET.SubElement(evt_elem, k)
        sub.text = str(v)

tree = ET.ElementTree(root)
xml_path = OUT_DIR / "sample_events_250.xml"
tree.write(xml_path, encoding="utf-8", xml_declaration=True)
print(f"Generated {xml_path}")
