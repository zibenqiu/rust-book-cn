// Note: 读取 public 目录下的 docs/ref 下的 index.html，解析出其中的 article 内容，翻译其中的中文，写回 index.html

const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const glob = require('glob');
const { Semaphore } = require('async-mutex');

const { translate } = require('./utils.js');
// 使用信号量控制并发

const MAX_CONCURRENT = 2;

// Note: 配置各个文件需要翻译的节点选择器，如果不存在，则默认翻译页面首个 article 中的全部 p 标签内容
const defaultConfig = (more) => {
  return [
    {
      container: 'head',
      selector: 'title',
    },
    {
      container: '#page-wrapper #content',
      selector: `p, h1, h2, h3`,
    },
  ];
};
const config = {
  // 'website/public/index.html': [...defaultConfig()],
  // 'website/public/examples/index.html': [...defaultConfig('h2, h3')],
  // 'website/public/examples/basic/index.html': [...defaultConfig('ul li, h1')],
  // 'website/public/examples/markdown/index.html': [
  //   ...defaultConfig('textarea#content'),
  // ],
  // 'website/public/docs/ref/index.html': [
  //   ...defaultConfig('ul li, #part_top h2'),
  // ],
  // 'website/public/docs/index.html': [...defaultConfig('h2, h3')],
};

const propertyMap = {
  title: 'Rust 中文',
  description: 'Rust 中文文档',
  url: 'https://rust.xheldon.com',
};

const semaphore = new Semaphore(MAX_CONCURRENT);
// 使用 glob 模块来匹配文件
let files;
files = glob.sync(path.resolve(__dirname, `book_src/book/**/*.html`), {
  ignore: ['**/print.html'], // 跳过 print 页面 ，因为它是全部页面的集合！
});
Promise.all(
  files.map((file) => {
    return new Promise((rootResolve) => {
      const rawString = fs.readFileSync(file, 'utf8');
      if (!rawString) {
        console.error('文件不存在');
        process.exit(1);
      }
      const key = path.relative(__dirname, file);
      const dom = new JSDOM(rawString);
      const document = dom.window.document;

      // Note: 修改 head 部分的 meta 信息
      document.querySelector('html').setAttribute('lang', 'zh-CN');
      const head = document.querySelector('head');
      if (head) {
        const metas = head.querySelectorAll('meta');
        if (metas.length) {
          metas.forEach((meta) => {
            const property = meta.getAttribute('property');
            if (property && propertyMap[property]) {
              meta.setAttribute('content', propertyMap[property]);
            }
          });
        }
        Object.keys(propertyMap).forEach((property) => {
          const meta = document.createElement('meta');
          meta.setAttribute('name', property);
          meta.setAttribute('content', propertyMap[property]);
          head.appendChild(meta);

          const meta2 = document.createElement('meta');
          meta2.setAttribute('property', `og:${property}`);
          meta2.setAttribute('content', propertyMap[property]);
          head.appendChild(meta2);
        });
        // Note: 增加 google 统计/广告（要吃饭呀）
        // Note: 谷歌统计
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=G-V7NE1X37EX';
        head.appendChild(script);
        const script2 = document.createElement('script');
        script2.innerHTML = `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-V7NE1X37EX')`;
        head.appendChild(script2);
        // Note: 谷歌广告
        const script3 = document.createElement('script');
        script3.async = true;
        script3.crossorigin = 'anonymous';
        script3.src =
          'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5486286026923411';
        head.appendChild(script3);
        const style = document.createElement('style');
        style.innerHTML = fs.readFileSync(
          path.resolve(__dirname, 'style.css'),
          'utf8'
        );
        head.appendChild(style);
      }

      // Note: 修改 nav 部分，增加译者地址
      const nav = document.querySelector('#menu-bar .right-buttons');
      if (nav) {
        const a = document.createElement('a');
        a.href = 'https://github.com/Xheldon/rust-book-cn';
        a.target = '_blank';
        const i = document.createElement('i');
        i.className = 'fa fa-language';
        a.appendChild(i);

        const a2 = document.createElement('a');
        a2.href = 'https://www.xheldon.com';
        a2.target = '_blank';
        const i2 = document.createElement('i');
        i2.className = 'fa fa-id-card';
        a2.appendChild(i2);

        nav.appendChild(a);
        nav.appendChild(a2);
      }
      const banner = document.createElement('div');
      banner.id = 'banner-info';
      // Note: 整站通知
      const p = key.replace('book_src/book', '').replace('.html', '');
      banner.innerHTML = `本文档为 AI + 人工翻译，hover 可以显示原文。当前页翻译有问题？<a style="cursor: pointer;" href="https://github.com/Xheldon/rust-book-cn/blob/main/dict${p}.json" target="_blank">我来翻译！</a>`;
      const bodyContainer = document.querySelector('#menu-bar');
      if (bodyContainer) {
        bodyContainer.insertBefore(banner, bodyContainer.firstChild);
      }
      // Note: 添加 hover 显示原文的样式信息

      // Note: 如果 config 中的路径文件不存在，则使用默认，否则使用 config 配置文件
      let list = [];
      list = (config[key] || defaultConfig())
        .map((c) => {
          const container = document.querySelector(c.container);
          if (!container) {
            console.log(`${file} 未找到 ${c.container} 标签`);
            return;
          }
          return [
            ...container.querySelectorAll(`${c.selector}:not([data-x-en])`),
          ];
        })
        .flat()
        .filter(Boolean);
      if (!list.length) {
        console.log(`${file} 不存在可翻译内容，中断`);
        rootResolve();
        return;
      }

      const dictPath = file
        .replace('.html', '.json')
        .replace('book_src/book', 'dict');
      if (!fs.existsSync(dictPath)) {
        // Note: 如果不存在，则递归创建
        fs.mkdirSync(path.dirname(dictPath), { recursive: true });
        fs.writeFileSync(dictPath, '{}');
      }
      let dict = {};
      try {
        dict = JSON.parse(fs.readFileSync(dictPath, 'utf8'));
      } catch (error) {
        console.error(`${dictPath} 解析失败, 跳过`);
        rootResolve();
        return;
      }
      Promise.all(
        Array.from(list).map((item, key) => {
          return new Promise((resolve) => {
            const text = item.innerHTML.trim();
            // Note: 移除换行符
            const pureText = item.textContent.trim().replace(/\s+/gm, ' ');
            if (!pureText) {
              resolve();
              return;
            }
            if (dict[pureText]) {
              if (dict[pureText]._translate) {
                item.innerHTML = dict[pureText]._translate;
                // Note: hover 显示原文，不需要 html 标签
                if (item.tagName === 'P' || item.tagName === 'LI') {
                  item.setAttribute('data-x-en', pureText);
                }
              }
              // Note: 如果有注释，则插入到当前 p 后面
              if (dict[pureText]._note) {
                const note = document.createElement('div');
                note.setAttribute('type', 'comment');
                note.innerHTML = dict[pureText]._note;
                // Note: 如果 p 本身在 a 标签里面，而 p 内又有 a 标签，那么实际渲染的时候会发生意外当的情况
                if (item.parentNode.tagName === 'A') {
                  item.parentNode?.parentNode?.insertBefore(
                    note,
                    item.parentNode?.nextSibling
                  );
                } else {
                  item.parentNode.insertBefore(note, item.nextSibling);
                }
              }
              resolve();
            } else {
              return semaphore.acquire().then(() => {
                return translate(text, { key: file })
                  .then((translate) => {
                    console.log('文件:', file, '--------');
                    dict[pureText] = {
                      _translate: translate,
                      _note: '',
                    };
                    console.log('AI 翻译:', `${pureText} -> ${translate}`);
                    // Note: 跟之前一样替换
                    item.innerHTML = dict[pureText]._translate;
                    item.setAttribute('data-x-en', pureText);
                  })
                  .finally(() => {
                    // Note: 随机增加延迟
                    setTimeout(() => {
                      semaphore.release();
                      resolve();
                    }, Math.random() * 500);
                  });
              });
            }
          });
        })
      ).finally(() => {
        // 在文件处理完成后（不管有没有错误,保存更新后的字典
        console.log(`${file} 翻译完成`);
        fs.writeFileSync(dictPath, JSON.stringify(dict, null, 2));
        fs.writeFileSync(file, dom.serialize());
        rootResolve();
      });
    });
  })
).finally(() => {
  console.log(`文件全部翻译完成`);
});
