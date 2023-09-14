// The Rectangle
////
let big_rect   = square(150).fill('orange');
let small_rect = square(20).fill('blue').rotate(Math.PI/4);
let r1 = small_rect.position(big_rect.get_anchor('top-left'));
let r2 = small_rect.position(big_rect.get_anchor('top-right'));
let r3 = small_rect.position(big_rect.get_anchor('bottom-left'));
let r4 = small_rect.position(big_rect.get_anchor('bottom-right'));
draw(big_rect, r1, r2, r3, r4);
