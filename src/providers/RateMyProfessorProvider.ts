import { RateMyProfessorService } from '../services/RateMyProfessorService';

export class RateMyProfessorProvider {
  name = 'ratemyprofessor';

  constructor(private svc: RateMyProfessorService) {}

  async search(query: string) {
    const result = await this.svc.searchProfessor(query);
    return {
      provider: 'ratemyprofessor',
      query,
      results: result.professors.map((prof) => ({
        title: prof.name,
        snippet: `${prof.school} - ${prof.department} | Rating: ${prof.avgRating}/5 (${prof.numRatings} reviews)`,
        url: `https://www.ratemyprofessors.com/professor/${prof.id}`,
        metadata: {
          rating: prof.avgRating,
          difficulty: prof.avgDifficulty,
          wouldTakeAgain: prof.wouldTakeAgain,
          numRatings: prof.numRatings
        }
      }))
    };
  }
}
