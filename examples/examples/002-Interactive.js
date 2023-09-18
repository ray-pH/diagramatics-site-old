// Interactive Slider
////
int.draw_function = (inp) => {
    let x = inp['x'];

    let big_circ   = circle(50);
    let small_rect = square(20).fill('blue').translate(V2(x,0));
    draw(big_circ, small_rect);
};

int.slider('x', -50, 50, 0);
int.draw();
