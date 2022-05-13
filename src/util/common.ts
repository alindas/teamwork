/**
 * @describe 将资源文件下载到本地
 * @return 请求失败抛出错误信息
 */
 const downloadFile = async ({
  file,
  name = 'file',
  mimeType,
  options
 } : {
   file: string | Blob,
   name?: string,
   mimeType?: string,
   options?: RequestInit
 }) => {
 let file_blob;
 // 判断资源类型，如果是 url 地址则请求资源
 if(typeof file === 'string') {
   let response = await fetch(file, options);
   if(!response.ok) {
     throw new Error(response.statusText);
   }
   // 内容转变成blob地址
   file_blob = await response.blob();
 }
 else {
   file_blob = file;
 }
 // 创建隐藏的可下载链接
 let objectUrl = window.URL.createObjectURL(mimeType ? new Blob([file_blob], {type: mimeType}) : file_blob);
 let a = document.createElement('a');
 a.href = objectUrl;
 a.download = name;
 a.click()
 a.remove();
 // 创建完毕释放内存
 window.URL.revokeObjectURL(objectUrl);
}

export {
  downloadFile,
}
