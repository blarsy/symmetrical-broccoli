import dayjs from "dayjs"
import { PropsWithChildren } from "react"

export interface PropsWithVersion extends PropsWithChildren {
    version: string
}

export const maxLength = (text: string | undefined, maxLength: number) => {
    if(!text) return ''

    const terminationSequence = '...'
    if(text.length > (maxLength - terminationSequence.length)) {
        return `${text.substring(0, maxLength - terminationSequence.length)}${terminationSequence}`
    }
    return text
}

export enum AuthProviders {
    google = 0,
    apple = 1
}

export const userFriendlyTime = (time: Date, shortDateFormat: string) => {
  const djTime = dayjs.utc(time)
  const millisecondsEllapsed = Math.abs(djTime.diff())
  const epoch = djTime.valueOf()

  if(millisecondsEllapsed < 10 * 60 * 1000)
    return djTime.local().fromNow()
  else if (millisecondsEllapsed < Math.abs(djTime.startOf('day').diff(djTime))) {
    return djTime.local().format('HH:mm')
  } else if (epoch > dayjs().startOf('day').valueOf() - (6 * 24 * 60 * 60 * 1000)) {
    return djTime.local().format('ddd')
  } else if(epoch > dayjs().startOf('day').valueOf() - (364 * 24 * 60 * 60 * 1000)) {
    return djTime.local().format(shortDateFormat)
  } else {
    return djTime.local().format('MMM YY')
  }
}