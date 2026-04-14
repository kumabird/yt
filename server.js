import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.disable("x-powered-by");

app.get("/:id", (req, res) => {
  const id = req.params.id.replace(/[^a-zA-Z0-9_-]/g, "");

  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Viewer</title>
<style>
html,body{
margin:0;
width:100%;
height:100%;
background:#000;
overflow:hidden;
}
iframe{
width:100%;
height:100%;
border:0;
}
</style>
</head>
<body>
<iframe
src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1"
allow="autoplay; encrypted-media"
allowfullscreen>
</iframe>
</body>
</html>
  `);
});

app.get("/", (req,res)=>{
  res.send("Viewer Running");
});

app.listen(PORT);
