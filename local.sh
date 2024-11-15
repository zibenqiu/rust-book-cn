#!/bin/bash

# 此脚本用于方便本地构建，不走 Github Action，其行为与 Github Action 一致

rm -rf website

git clone https://github.com/rust-lang/book.git ./book_src
cd book_src
cargo install mdbook --locked
cargo install --locked --path packages/mdbook-trpl-listing
cargo install --locked --path packages/mdbook-trpl-note
mdbook build

node index.js
