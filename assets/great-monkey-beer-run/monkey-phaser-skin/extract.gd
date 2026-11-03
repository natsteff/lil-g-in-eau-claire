extends SceneTree
func _initialize():
 var base = "res://../exports/monkey-phaser-skin/"
 var img = Image.load_from_file("res://assets/gunther.png")
 img.convert(Image.FORMAT_RGBA8)
 for y in range(img.get_height()):
  for x in range(img.get_width()):
   var c = img.get_pixel(x,y)
   c.a *= 1.0-smoothstep(0.35,0.65,minf(c.r,c.b)-c.g)
   img.set_pixel(x,y,c)
 assert(img.save_png(base+"sprites/lil-g.png")==OK)
 var names = ["idle","run-1","run-2","run-3","jump","fall"]
 for i in range(6):
  assert(img.get_region(Rect2i(i*362,0,362,724)).save_png(base+"sprites/lil-g-"+names[i]+".png")==OK)
 print("Exported transparent sheet and six registered frames")
 quit()
