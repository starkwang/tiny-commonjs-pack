#tiny-commonjs-pack

```
git clone https://github.com/starkwang/tiny-commonjs-pack.git

cd tiny-commonjs-pack

npm install
```
------


#Test
Make sure you have `babel-node` for running this packer:

```
npm install babel-node -g
```
```
babel-node commonjs-pack.js test/index.js --presets es2015
```
And then you'll get bundle.js
