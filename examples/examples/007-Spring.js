// Spring Oscillation
////
let x0 = 50;
let amplitude = 25;
let omega = 1;

int.draw_function = (inp) => {
    let t = inp['t'];
    let x = x0 + amplitude * Math.cos(omega * t);
    
    let wall  = line(V2(0,0), V2(0,20)).strokewidth(2);
    let floor = line(V2(0,0), V2(100,0)).strokewidth(2);
    let box   = square(20).position(V2(x,10))
        .fill('lightblue').stroke('none');
    // let spring = line(wall.get_anchor('center-right'), box.get_anchor('center-left'))
    let p1 = wall.get_anchor('center-right');
    let p2 = box.get_anchor('center-left');
    let spring = mechanics.spring(p1,p2, 2, 10, 1.2);
    draw(box, wall, floor, spring)
}

let period = 2*Math.PI/omega;
int.slider('t', 0, 2*period, period/4, 0.1, 2);
int.draw();
