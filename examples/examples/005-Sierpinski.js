// Sierpiński triangle
////
int.draw_function = (inp) => {
  let n = inp['n'];
  
  let s0 = regular_polygon_side(3, 50)
    .position().fill('lightblue').stroke('none');
  let snext = (s) => diagram_combine(
    s,
    s.translate(V2(50,0)),
    s.translate(V2(25,50*Math.sqrt(3)/2)),
  ).scale(V2(0.5,0.5)).position().flatten();
  let sn = (n) => {
    if (n == 0) return s0;
    else return snext(sn(n-1));
  }
  let a = sn(n);
  draw(a);
};

int.slider('n', 0, 4, 1, 1);
int.draw();
