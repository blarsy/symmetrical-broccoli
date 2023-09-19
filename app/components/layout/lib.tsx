import React from "react";
import { Button, ButtonProps } from "react-native-paper";
import { primaryColor } from "./constants";

export const WhiteButton = (props: ButtonProps) => <Button mode="contained" textColor="#000" buttonColor="#fff" 
    labelStyle={{ fontSize: 20 }} {...props} />
export const OrangeButton = (props: ButtonProps) => <Button mode="contained" textColor="#fff" buttonColor={primaryColor}
    labelStyle={{ fontSize: 20 }} {...props} />
