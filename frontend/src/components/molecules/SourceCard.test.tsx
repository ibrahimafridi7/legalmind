import { vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SourceCard } from './SourceCard'

test('clicking a citation triggers handler', async () => {
  const user = userEvent.setup()
  const onClick = vi.fn()

  render(
    <SourceCard
      citation={{ id: 'c1', documentId: 'doc1', page: 2, snippet: 'hello' }}
      isActive={false}
      onClick={onClick}
    />
  )

  await user.click(screen.getByRole('button'))
  expect(onClick).toHaveBeenCalledTimes(1)
})

