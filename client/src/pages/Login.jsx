import React, { useState } from 'react'
import { Container, Paper , Typography,TextField, Button } from '@mui/material'

const Login = () => {


  const { isLogin, setisLogin } = useState(true)

  // const toggleLogin = () => setisLogin(false)


  return (
    <Container component={"main"} maxWidth="sx" >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          display: 'flex',
          flexDirection: "column",
          alignItems: "center"
        }}
      >


        {isLogin ? <span>Login</span> : <span>register</span>}
      </Paper>
    </Container>
  )
}

export default Login