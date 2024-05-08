import React = require("react")
import { withReactContext } from 'storybook-react-context'
import LoginForm from "./LoginForm"
import { AppContext } from "../AppContextProvider"
import { graphql } from 'msw'

export default {
    title: 'Empty',
    decorators: [withReactContext({
        Context: AppContext, initialState: { actions: { loginComplete: console.log } }
    })]
}

export const Defaults = () => <LoginForm toggleRecovering={() => {}} toggleRegistering={() => {}} onDone={() => {}} />