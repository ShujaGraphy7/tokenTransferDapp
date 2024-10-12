import React from 'react'

const MaxWidthWrapper = ({ children }) => {
    return (
        <div className='bg-background_black min-h-screen'>
            <div className={" mx-auto w-full max-w-screen-2xl px-2.5 md:px-20  "}>
                {children}
            </div>
        </div>
    )
}

export default MaxWidthWrapper
