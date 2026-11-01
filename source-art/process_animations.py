import os, json, shutil
from PIL import Image

base=os.path.join(os.path.dirname(os.path.abspath(__file__)),'sprites-limpios')

def load_mapping(path):
    with open(path) as fh:
        return json.load(fh)

def process(mapping_path):
    mapping=load_mapping(mapping_path)
    for char, anims in mapping.items():
        frames_dir=os.path.join(base,char,'frames')
        if not os.path.isdir(frames_dir):
            print('no frames dir for', char); continue
        files=sorted(os.listdir(frames_dir))
        anim_root=os.path.join(base,char,'animations')
        os.makedirs(anim_root, exist_ok=True)
        for anim in anims:
            name=anim['name']
            idxs=anim['frames']
            fps=anim.get('fps', 8)
            out_dir=os.path.join(anim_root,name)
            os.makedirs(out_dir, exist_ok=True)
            # copy & rename
            out_frames=[]
            for i,fn in enumerate(idxs, start=1):
                src=os.path.join(frames_dir, files[fn-1])
                dst_name=f"{char}_{name}_{i:03d}.png"
                dst=os.path.join(out_dir,dst_name)
                shutil.copy2(src,dst)
                out_frames.append(dst_name)
            # spritesheet horizontal strip
            imgs=[Image.open(os.path.join(out_dir,f)).convert('RGBA') for f in out_frames]
            w,h=imgs[0].size
            sheet=Image.new('RGBA',(w*len(imgs),h),(0,0,0,0))
            for i,im in enumerate(imgs):
                sheet.paste(im,(i*w,0),im)
            sheet_name=f"{char}_{name}_spritesheet.png"
            sheet.save(os.path.join(out_dir,sheet_name))
            # meta
            meta={
                "character": char,
                "animation": name,
                "fps": fps,
                "frame_count": len(out_frames),
                "frame_width": w,
                "frame_height": h,
                "frames": out_frames,
                "spritesheet": sheet_name
            }
            with open(os.path.join(out_dir,'meta.json'),'w') as fh:
                json.dump(meta, fh, indent=2)
            print(f"processed {char}/{name}: {len(out_frames)} frames")
    print('DONE')

if __name__=='__main__':
    import sys
    if len(sys.argv)<2:
        print('Usage: python process_animations.py <mapping_json_path>')
    else:
        process(sys.argv[1])
PYEOF