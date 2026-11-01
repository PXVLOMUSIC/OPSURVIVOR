import json,sys,collections
rs=[json.loads(l) for l in open(sys.argv[1]) if l.startswith('{')]
g=collections.defaultdict(list)
for r in rs:
    for k in [(r['ch'],r['map']),(r['ch'],'*'),('*',r['map']),('*','*')]: g[k].append(r)
print(f"{'char':7}{'map':13}{'n':>3}{'win%':>6}{'tMed':>6}{'lvl':>5}{'kills':>7}{'maxOn':>6}")
for k in sorted(g):
    x=g[k];n=len(x);w=sum(r['st']=='VICTORY' for r in x);ts=sorted(r['t'] for r in x)
    print(f"{k[0]:7}{k[1]:13}{n:>3}{100*w/n:>6.0f}{ts[n//2]:>6}{sum(r['lvl'] for r in x)/n:>5.0f}{sum(r['k'] for r in x)/n:>7.0f}{sum(r['on'] for r in x)/n:>6.0f}")
