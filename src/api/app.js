import request from '@/libs/request'

/**
 * pro_外部_网格统计
 */
export function getOutGridStat() {
    return request({
        url: '/previewApi/api/pathVisit/out_gridStat',
        method: 'post'
    })
}

/**
 * pro_外部_事件统计
 */
export function getOutEventStat() {
    return request({
        url: '/previewApi/api/pathVisit/out_eventStat',
        method: 'post'
    })
}
