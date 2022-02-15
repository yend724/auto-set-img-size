const fs = require("fs");
const path = require("path");
const cpx = require("cpx");
const jsdom = require("jsdom");
const sizeOf = require("image-size");
const { minify } = require("html-minifier");

// プロジェクトのパス
const root = path.join(__dirname, "/");
const srcRoot = path.join(root, "src/");
const distRoot = path.join(root, "dist/")

// fsでsrc/index.htmlを取得
const html = fs.readFileSync(`${path.join(srcRoot, "index.html")}`, "utf-8");
// jsdomでDOM操作できるように
const { JSDOM } = jsdom;
const dom = new JSDOM(html);
const doc = dom.window.document;

// picture > source と img を取得
const sources = doc.querySelectorAll("picture > source");
const imgs = doc.querySelectorAll("img");

// 画像のパスを取得する正規表現
const regexp = /\S+\.(jpg|png|gif|webp)/g;
sources.forEach(source => {
  // srcsetから画像のパスだけ取得する
  // 例えば
  // srcset="./assets/img/960-540.png, ./assets/img/1920-1080.png 2x"
  // から
  // "./assets/img/960-540.png"と"./assets/img/1920-1080.png"を抽出する
  const srcset = source.getAttribute("srcset");
  const matchs = [...srcset.matchAll(regexp)];

  if(matchs.length > 0){
    // srcsetの最初に書かれていた画像のパスが対象
    const src = matchs[0][0];
    // image-sizeを使用して画像のサイズを取得
    const dimensions = sizeOf(path.join(srcRoot, src));
    // width/heightをsourceタグにセット
    source.setAttribute("width", dimensions.width);
    source.setAttribute("height", dimensions.height);
  }
});

imgs.forEach(img => {
  const src = img.getAttribute("src");
  // image-sizeを使用して画像のサイズを取得
  const dimensions = sizeOf(path.join(srcRoot, src));
  // width/heightをimgタグにセット
  img.setAttribute("width", dimensions.width);
  img.setAttribute("height", dimensions.height);
});

// htmlファイルを圧縮（必須な操作ではないが、jsdomで吐き出されるソースが少し歪なので圧縮する）
const mini = minify(dom.serialize(), {
  collapseWhitespace: true,
  minifyCSS: true,
  minifyJS: true,
});

// distディレクトリがなかったらdistを作成
if(!fs.existsSync(distRoot)){
  fs.mkdirSync(`${root}/dist/`, { recursive: true }, (err) => {
    if (err) throw err;
  });
}
// dist/index.htmlにwidth/heightを付与したファイルを吐き出す
fs.writeFile(`${root}dist/index.html`, mini, error => {
  if (error) throw error;
});
// dist/assets/img/以下に画像ファイルをコピー
cpx.copy(`${srcRoot}assets/img/*.{jpg,png,gif,webp}`, `${root}dist/assets/img/`, error => {
  if (error) throw error;
})