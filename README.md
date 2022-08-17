# 文件切片上传（笔记）
## steps
### client端
1. 页面上放简单两个控件
   - input type=file
   - button
2. 监听input的onchange事件，获取文件流，对流进行切片后，找个地方存着（e.g.挂到window上）
   - `chunk = e.target.file[0]` 
   - `chunks = chunk.slice(from, to)`
3. 监听button的onclick事件，把切好片的流分别上传
   - request Content-Type: multipart/form-data
   - request payload: 
    ```
    {
       chunk: 上述切好片的chunk,
       idx: chunk的顺序,
       total: chunks的总片数,
       filename: 文件名,
    }
    ```

