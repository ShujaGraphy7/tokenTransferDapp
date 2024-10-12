import React from 'react'
import { Outlet } from 'react-router-dom'
import MaxWidthWrapper from './utils/MaxWidthWrapper'
import NavBar from './Components/nav/NavBar'

const Routing = () => {
    return (
        <MaxWidthWrapper>
            <NavBar/>
            <Outlet />
        </MaxWidthWrapper>
    )
}

export default Routing