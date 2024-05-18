import React, { useState, useEffect } from "react"
import "./ModeSwitch.scss"

export type Option = {
  title: string
  key: string
}

interface ModeSwitchProps {
  options: Option[]
  defaultKey: string
  onChange: (key: string) => void
}

const ModeSwitch: React.FC<ModeSwitchProps> = ({
  options,
  defaultKey,
  onChange,
}) => {
  const [currentKey, setCurrentKey] = useState(defaultKey)

  useEffect(() => {
    setCurrentKey(defaultKey)
  }, [defaultKey])

  const onOptionClick = (key: string) => {
    setCurrentKey(key)
    onChange(key)
  }

  return (
    <div className="modeswitch">
      {options.map((option) => (
        <div
          key={option.key}
          className={`option ${option.key === currentKey ? "enabled" : ""}`}
          onClick={() => onOptionClick(option.key)}
        >
          <span>{option.title}</span>
        </div>
      ))}
    </div>
  )
}

export default ModeSwitch
