function index(g, x, y) {
  if (g == null)
    return (x + y * width) * 4;
  else
    return (x + y * g.width) * 4;
}

function DivideBy255(value) {
  return (value + 1 + (value >> 8)) >> 8;
}
function dither(g) {
  if (g == null) {
    let _scale = Math.ceil(1, map(width, 0, 1024, 0, 1, true));
    loadPixels();
    for (let y = 0; y < height - _scale; y++) {
      for (let x = _scale; x < width - _scale; x++) {
        let oldr = pixels[index(g, x, y)];
        let oldg = pixels[index(g, x, y) + 1];
        let oldb = pixels[index(g, x, y) + 2];

        let newr = (DivideBy255(oldr) * 255) | 0;
        let newg = (DivideBy255(oldg) * 255) | 0;
        let newb = (DivideBy255(oldb) * 255) | 0;

        pixels[index(g, x, y)] = newr;
        pixels[index(g, x, y) + 1] = newg;
        pixels[index(g, x, y) + 2] = newb;

        for (let _y = 1; _y <= _scale; _y++) {
          for (let _x = 1; _x <= _scale; _x++) {
            pixels[index(g, x + _x, y)] += ((oldr - newr) * 7) >> 4;
            pixels[index(g, x + _x, y) + 1] += ((oldr - newr) * 7) >> 4;
            pixels[index(g, x + _x, y) + 2] += ((oldr - newr) * 7) >> 4;

            pixels[index(g, x - _x, y + _y)] += ((oldr - newr) * 3) >> 4;
            pixels[index(g, x - _x, y + _y) + 1] += ((oldr - newr) * 3) >> 4;
            pixels[index(g, x - _x, y + _y) + 2] += ((oldr - newr) * 3) >> 4;

            pixels[index(g, x, y + _y)] += ((oldr - newr) * 5) >> 4;
            pixels[index(g, x, y + _y) + 1] += ((oldr - newr) * 5) >> 4;
            pixels[index(g, x, y + _y) + 2] += ((oldr - newr) * 5) >> 4;

            pixels[index(g, x + _x, y + _y)] += ((oldr - newr) * 1) >> 4;
            pixels[index(g, x + _x, y + _y) + 1] += ((oldr - newr) * 1) >> 4;
            pixels[index(g, x + _x, y + _y) + 2] += ((oldr - newr) * 1) >> 4;
          }
        }
      }
    }
    updatePixels();
  } else {
    g.loadPixels();

    for (let y = 0; y < g.height - 1; y++) {
      for (let x = 1; x < g.width - 1; x++) {
        let oldr = g.pixels[index(g, x, y)];
        let oldg = g.pixels[index(g, x, y) + 1];
        let oldb = g.pixels[index(g, x, y) + 2];

        // let factor = 1.0;
        let newr = (DivideBy255(oldr) * 255) | 0;
        let newg = (DivideBy255(oldg) * 255) | 0;
        let newb = (DivideBy255(oldb) * 255) | 0;

        g.pixels[index(g, x, y)] = newr;
        g.pixels[index(g, x, y) + 1] = newg;
        g.pixels[index(g, x, y) + 2] = newb;

        g.pixels[index(g, x + 1, y)] += ((oldr - newr) * 7) >> 4;
        g.pixels[index(g, x + 1, y) + 1] += ((oldr - newr) * 7) >> 4;
        g.pixels[index(g, x + 1, y) + 2] += ((oldr - newr) * 7) >> 4;

        g.pixels[index(g, x - 1, y + 1)] += ((oldr - newr) * 3) >> 4;
        g.pixels[index(g, x - 1, y + 1) + 1] += ((oldr - newr) * 3) >> 4;
        g.pixels[index(g, x - 1, y + 1) + 2] += ((oldr - newr) * 3) >> 4;

        g.pixels[index(g, x, y + 1)] += ((oldr - newr) * 5) >> 4;
        g.pixels[index(g, x, y + 1) + 1] += ((oldr - newr) * 5) >> 4;
        g.pixels[index(g, x, y + 1) + 2] += ((oldr - newr) * 5) >> 4;

        g.pixels[index(g, x + 1, y + 1)] += ((oldr - newr) * 1) >> 4;
        g.pixels[index(g, x + 1, y + 1) + 1] += ((oldr - newr) * 1) >> 4;
        g.pixels[index(g, x + 1, y + 1) + 2] += ((oldr - newr) * 1) >> 4;
        g.updatePixels();
      }
    }
  }
}
