import { Prisma } from '@prisma/client'

export const websiteReadWhere = (userId: string): Prisma.WebsiteWhereInput => ({
  OR: [
    { userId },
    {
      team: {
        members: {
          some: { userId },
        },
      },
    },
  ],
})

export const websiteWriteWhere = (userId: string): Prisma.WebsiteWhereInput => ({
  OR: [
    { userId },
    {
      team: {
        members: {
          some: {
            userId,
            role: { not: 'VIEWER' },
          },
        },
      },
    },
  ],
})
