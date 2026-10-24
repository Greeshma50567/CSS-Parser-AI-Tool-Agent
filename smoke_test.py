from milestone1_parser import parse_css

with open('sample.css', encoding='utf-8') as f:
    css = f.read()

rules = parse_css(css)
print(f'Total rules parsed: {len(rules)}')
print()
for r in rules:
    sel = r["selector"]
    props = list(r["properties"].keys())
    cnt = r["property_count"]
    print(f'  Selector : {sel}')
    print(f'  Props    : {props}')
    print(f'  Count    : {cnt}')
    print()
