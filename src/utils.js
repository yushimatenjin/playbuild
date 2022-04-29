export const diff2Op = diffs => {
    const ops = []
    for (var x = 0; x < diffs.length; x++) {
      switch (diffs[x][0]) {
        case 1:
          //insert
          ops.push(diffs[x][1]);
          break;
        case -1:
          // delete
          ops.push({d: diffs[x][1].length});
          break;
        case 0:
          // equals
          ops.push(diffs[x][1].length);
          break;
      }
    }
    return ops
  }