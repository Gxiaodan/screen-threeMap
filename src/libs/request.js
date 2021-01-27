import axios from 'axios'
// 创建axios实例
const service = axios.create({
    headers: {
        'Content-Type': 'application/json; charset=utf-8'
    },
    timeout: 300000 // 请求超时时间,
})
// request拦截器
service.interceptors.request.use(
    config => {
        config.headers['content-type'] = 'application/json;charset=UTF-8'
        config.headers['Authorization'] = 'eyJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE2MDI3NDEzNDIsImV4cCI6NDc1NjM0MTM0Mn0.zSHuy1ldGd3LT7zRbCZVdrpewF47RbTJUe4Md_7bEWM_vsconf'
        return config
    },
    error => {
        return Promise.reject(error)
    }
)
const codeMessage = {
    200: '服务器成功返回请求的数据。',
    201: '新建或修改数据成功。',
    202: '一个请求已经进入后台排队（异步任务）。',
    204: '删除数据成功。',
    400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
    401: '用户没有权限（令牌、用户名、密码错误）。',
    403: '用户得到授权，但是访问是被禁止的。',
    404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
    405: '请求不被允许',
    406: '请求的格式不可得。',
    410: '请求的资源被永久删除，且不会再得到的。',
    413: '请求体大小超过限制。',
    422: '当创建一个对象时，发生一个验证错误。',
    500: '服务器发生错误，请检查服务器。',
    502: '网关错误。',
    503: '服务不可用，服务器暂时过载或维护。',
    504: '网关超时。'
}
// response 拦截器
service.interceptors.response.use(
    async response => {
        const res = response.data
        return res
    },
    error => {
        let msg = error.message
        if (msg === 'Network Error') {
            msg = '连接服务器异常'
        }
        if (error.response && error.response.data) {
            msg = error.response.data.msg || codeMessage[error.response.status]
            switch (error.response.status) {
                case 400:
                    msg = '参数异常'
                case 401:
                    msg = '登录超时或没有权限'
                    window.sessionStorage.removeItem('token')
            }
        } else {
            msg = error.response ? codeMessage[error.response.status] : error.message
        }
        return Promise.reject(error)
    }
)

export default service
