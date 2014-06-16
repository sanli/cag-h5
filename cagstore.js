// cagstore.js
/**
 * 管理图片存储目录
 *
 * 目录结构如下：
 *    cagstore
 *         - {uuid_of_painting}
 *             - tb.jpg    thumbnail缩略图, 宽度为128的整数倍
 *             - temp_{level}_0.jpg
 *             - {level}
 */