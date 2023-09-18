// Interactive Slider
////
int.draw_function = (inp) => {
    let x = inp['x'];

    let big_rect   = circle(50);
    let small_rect = square(20).fill('blue').translate(V2(x,0));
    draw(big_rect, small_rect);
};

int.slider('x', -50, 50, 0);
int.draw();
