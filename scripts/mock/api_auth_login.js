const proxy = {};

proxy['POST /api/auth/login'] = (req, res) => {
  res.json({
    "code": 0,
    "message": "success",
    "data": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJwYXlsb2FkIjoie1wiYWNjb3VudFwiOlwic3VwZXJcIixcImV4dHJhXCI6XCJcIixcImlkXCI6MTAwLFwibmFtZVwiOlwic3VwZXJcIixcInRlbmFudElkXCI6MH0iLCJleHAiOjE1Nzc1ODg3Mzd9.I20DnBmtJCOz0NG7RjfuomohJyyMk5r_h8mrYDI3cgw"
  });
}

module.exports = proxy;