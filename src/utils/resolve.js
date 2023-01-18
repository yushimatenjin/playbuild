import path from 'path-browserify'

export const resolveModule = function (p, files, extns = [".js", ".ts"]) {
  // console.log("searching", p);
  let modulePath = path.resolve(p);
  let ext = path.extname(p);

  console.log('modulePath', modulePath)

  const isFile = (file) => files[file] !== undefined
  const checkExts = (path, extns) => {
    let ext = extns.find((e) => isFile(path + e));
    // if (ext) console.log("found ", path + ext);
    return path + (ext || "");
  };

  if (isFile(modulePath)) return modulePath;

  // let modulePat
  if (ext === "") {
    // console.log("no ext", modulePath);
    modulePath = checkExts(modulePath, extns);
  }

  if (isFile(modulePath)) return modulePath;

  modulePath = path.resolve(modulePath, "index");
  if (isFile(modulePath)) return modulePath;

  modulePath = checkExts(modulePath, extns);
  if (isFile(modulePath)) return modulePath;
};