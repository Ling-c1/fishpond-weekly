// PostCSS 配置：项目未启用 "type": "module"，这里用 CommonJS 写法避免 Node 解析告警
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}
