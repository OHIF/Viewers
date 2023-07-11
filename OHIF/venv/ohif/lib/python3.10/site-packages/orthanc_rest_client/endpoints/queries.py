# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.

from apiron import JsonEndpoint, Service

__all__ = ["OrthancQueries"]


class OrthancQueries(Service):

    queries = JsonEndpoint(path="queries/")
    query = JsonEndpoint(path="queries/{id_}/")
    del_query = JsonEndpoint(path="queries/{id_}/", default_method="DELETE")
    answers = JsonEndpoint(path="queries/{id_}/answers/")
    answers_content = JsonEndpoint(path="queries/{id_}/answers/{index}/content/")
    answers_retrieve = JsonEndpoint(
        path="queries/{id_}/answers/{index}/retrieve/", default_method="POST"
    )
    answers_instances = JsonEndpoint(
        path="queries/{id_}/answers/{index}/query-instances/", default_method="POST"
    )
    answers_series = JsonEndpoint(
        path="queries/{id_}/answers/{index}/query-series/", default_method="POST"
    )
    answers_studies = JsonEndpoint(
        path="queries/{id_}/answers/{index}/query-studies/", default_method="POST"
    )
    level = JsonEndpoint(path="queries/{id_}/level/")
    modality = JsonEndpoint(path="queries/{id_}/modality/")
    query_query = JsonEndpoint(path="queries/{id_}/query/")
    retrieve = JsonEndpoint(path="queries/{id_}/retrieve/", default_method="POST")
