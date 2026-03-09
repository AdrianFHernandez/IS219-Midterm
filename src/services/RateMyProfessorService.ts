interface Professor {
  id: string;
  name: string;
  school: string;
  avgRating: number;
  numRatings: number;
  avgDifficulty: number;
  wouldTakeAgain: number;
  department: string;
}

interface RMPSearchResult {
  professors: Professor[];
}

export class RateMyProfessorService {
  private baseUrl = 'https://www.ratemyprofessors.com/graphql';
  private defaultMaxResults = 150;
  private pageSize = 50;

  async searchProfessor(name: string, maxResults = this.defaultMaxResults): Promise<RMPSearchResult> {
    try {
      const professors = await this.fetchTeachersPaged(name, maxResults);
      return { professors };
    } catch (error: any) {
      console.error('Error fetching from Rate My Professor:', error.message);
      return { professors: [] };
    }
  }

  private async fetchTeachersPaged(name: string, maxResults: number): Promise<Professor[]> {
    const collected: Professor[] = [];
    const seenIds = new Set<string>();
    let after: string | null = null;

    while (collected.length < maxResults) {
      const payload = this.buildSearchQueryPayload(name, after);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error('RMP API Error:', response.statusText);
        break;
      }

      const data = await response.json() as any;
      if (data.errors) {
        console.error('RMP API Error:', data.errors);
        break;
      }

      const pageProfessors = this.parseProfessors(data.data);
      for (const prof of pageProfessors) {
        if (!seenIds.has(prof.id)) {
          seenIds.add(prof.id);
          collected.push(prof);
          if (collected.length >= maxResults) break;
        }
      }

      const pageInfo = data?.data?.newSearch?.teachers?.pageInfo;
      if (!pageInfo?.hasNextPage || !pageInfo?.endCursor) {
        break;
      }

      after = String(pageInfo.endCursor);
    }

    return collected;
  }

  private buildSearchQueryPayload(name: string, after: string | null): { query: string; variables: Record<string, unknown> } {
    // Current RMP schema uses `newSearch` rather than `search`.
    const query = `
      query NewSearchTeachersQuery($query: TeacherSearchQuery!, $after: String) {
        newSearch {
          teachers(query: $query, first: ${this.pageSize}, after: $after) {
            pageInfo {
              hasNextPage
              endCursor
            }
            edges {
              node {
                id
                firstName
                lastName
                department
                avgRating
                numRatings
                avgDifficulty
                wouldTakeAgainPercent
                school {
                  name
                }
              }
            }
          }
        }
      }
    `;

    return {
      query,
      variables: {
        query: {
          text: name
        },
        after
      }
    };
  }

  private parseProfessors(data: any): Professor[] {
    const professors: Professor[] = [];

    try {
      const edges = data?.newSearch?.teachers?.edges;
      if (Array.isArray(edges)) {
        edges.forEach((edge: any) => {
          const prof = edge.node;
          if (prof.firstName && prof.lastName) {
            professors.push({
              id: String(prof.id),
              name: `${prof.firstName} ${prof.lastName}`,
              school: prof.school?.name || 'Unknown',
              avgRating: prof.avgRating || 0,
              numRatings: prof.numRatings || 0,
              avgDifficulty: prof.avgDifficulty || 0,
              wouldTakeAgain: prof.wouldTakeAgainPercent || 0,
              department: prof.department || 'Unknown'
            });
          }
        });
      }
    } catch (error: any) {
      console.error('Error parsing RMP response:', error.message);
    }

    return professors;
  }

  formatProfessorsForDisplay(professors: Professor[]): string {
    if (professors.length === 0) {
      return 'No professors found on Rate My Professor.';
    }

    let output = `\n📊 Rate My Professor Results:\n`;
    output += `${'-'.repeat(60)}\n`;

    professors.slice(0, 5).forEach((prof, index) => {
      output += `\n${index + 1}. ${prof.name}\n`;
      output += `   School: ${prof.school}\n`;
      output += `   Department: ${prof.department}\n`;
      output += `   Overall Rating: ⭐ ${prof.avgRating.toFixed(2)}/5.0 (${prof.numRatings} reviews)\n`;
      output += `   Difficulty: ${prof.avgDifficulty.toFixed(2)}/5.0\n`;
      output += `   Would Take Again: ${prof.wouldTakeAgain.toFixed(1)}%\n`;
    });

    output += `\n${'-'.repeat(60)}\n`;
    return output;
  }
}
