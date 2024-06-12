import { RouteProps } from "@/lib/utils";
import Account from "../account/Account";
import React from "react";
import { Resource } from "@/lib/schema";

export default ({ route, navigation }: RouteProps) => <Account id={route.params!.resourceId} viewResourceRequested={resource => {
    throw new Error("Function not implemented.")
} } chatOpenRequested={resource => {
    throw new Error("Function not implemented.")
} } />