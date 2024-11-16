> Rust Chinese documentation that automatically stays in sync with the original repository: https://rust.xheldon.com

> 自动与原始仓库保持同步的 Rust 中文文档: https://rust.xheldon.com

# English Instructions

## Rust Chinese Documentation

1. Translated based on Qwen2.5-72B-Instruct + manual corrections.
2. Comments are manually added.

## PR Instructions

1. Only need to maintain the `.json` files in the `dict` directory; if you feel the translation is incorrect, feel free to submit a PR.
2. Modify `_translate` in the `.json` file as needed.
3. `_translate` is for translated content, and `_note` is your understanding or commentary on it. The `_note` field supports HTML format and will be directly rendered below the original text.

## CI Steps

1. Pull the original repository `rust-lang/book` into the `book_src` directory, compare with `last-commit.txt`, proceed to next step if there are updates, otherwise terminate CI.
2. Navigate (`cd`) into the `book_src` directory and build various `html` files of the book.
3. After running `npm i`, execute `node index.js`. It will search for corresponding `.json` dictionaries in paths matching those under  `book_src/book/\*.html`, perform Chinese replacements where found; if not found, AI translation will be used and dictionary updated accordingly.
4. Move `book` folder from within `book_src` up one level into `public/`, push all changes upstream triggering Vercel's build update process.

## Local Build Instructions

1.Replace secrets.OPENAI_API_KEY & OPENAI_URL inside utils.js w/yours
Run ./local.sh (ensure exec permissions)
Check htmls generated under /books

# 中文说明

## Rust 中文文档

1. 基于 Qwen2.5-72B-Instruct + 人工修正翻译。
2. 注释部分为人工添加。

## PR 说明

1. 只需要维护 dict 目录的各个 `.json` 文件即可，如果感觉翻译的不对，欢迎提交 PR。
2. 修改 `.json` 文件中的 `_translate` 即可。
3. `_translate` 是翻译内容，`_note` 是你对内容的理解注释。`_note` 字段支持 HTML 格式，会直接渲染到原文下方。

## CI 步骤

1. 拉取原仓库 `rust-lang/book` 到 `book_src` 目录，对比 `last-commit.txt`，有更新则执行下一步，无更新则中断 CI。
2. cd 到 `book_src` 目录构建出 `book` 的各个 `html` 文件。
3. 根目录 `npm i` 后，运行 `node index.js`，查询跟 `book_src/book/\*.html` 同路径的 `dict` 目录中的 `.json` 字典，进行中文替换，如果字段未查询到，则进行 AI 翻译并更新字典。
4. 将 `book_src` 中的 `book` 目录移动到上层的 `public` 目录中，推送所有变更到远端，触发 Vercel 的构建更新。

## 本地构建说明

1. 替换 `utils.js` 中的 `secrets.OPENAI_API_KEY` 和 `secrets.OPENAI_URL` 为你自己的。
2. 执行 `./local.sh`（需要执行权限）。
3. 检查 `book_src/book` 目录下的各个 `html` 文件是否正常。

## 防止将来我自己忘记的备注

1. 本项目 CI 有两种触发方式：手动触发和每周检查一次。
2. ci 可能会修改 dict 目录中的文件，以及新产生 `html` 文件覆盖 `public` 中的同路径同名文件。
3. ci 会将修改再次提交到本仓库中，以触发 Vercel 的更新，因此本仓库不能通过 Merge 触发。
