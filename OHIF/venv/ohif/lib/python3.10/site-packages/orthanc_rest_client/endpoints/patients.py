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

from apiron import JsonEndpoint, StreamingEndpoint, Endpoint, Service

__all__ = ["OrthancPatients"]


class OrthancPatients(Service):

    patients = JsonEndpoint(path="patients/")
    patient = JsonEndpoint(path="patients/{id_}/")
    del_patient = JsonEndpoint(path="patients/{id_}/", default_method="DELETE")
    anonymize = JsonEndpoint(path="patients/{id_}/anonymize/", default_method="POST")
    archive = StreamingEndpoint(path="patients/{id_}/archive/")
    attachments = JsonEndpoint(path="patients/{id_}/attachments")
    attachment = JsonEndpoint(path="patients/{id_}/attachment/{name}/")
    del_attachment = JsonEndpoint(
        path="patients/{id_}/attachment/{name}/", default_method="DELETE"
    )
    put_attachment = JsonEndpoint(
        path="patients/{id_}/attachment/{name}/", default_method="PUT"
    )
    compress_attachment = JsonEndpoint(
        path="patients/{id_}/attachment/{name}/compress", default_method="POST"
    )
    compressed_attachment_data = StreamingEndpoint(
        path="patients/{id_}/attachment/{name}/compressed-data"
    )
    compressed_attachment_md5 = JsonEndpoint(
        path="patients/{id_}/attachment/{name}/compressed-md5"
    )
    compressed_attachment_size = JsonEndpoint(
        path="patients/{id_}/attachment/{name}/compressed-size"
    )
    attachment_data = StreamingEndpoint(path="patients/{id_}/attachment/{name}/data")
    attachment_is_compressed = JsonEndpoint(
        path="patients/{id_}/attachment/{name}/is-compressed"
    )
    attachment_md5 = JsonEndpoint(path="patients/{id_}/attachment/{name}/md5")
    attachment_size = JsonEndpoint(path="patients/{id_}/attachment/{name}/size")
    uncompress_attachment = JsonEndpoint(
        path="patients/{id_}/attachment/{name}/uncompress", default_method="POST"
    )
    verify_attachment = JsonEndpoint(
        path="patients/{id_}/attachment/{name}/verify-md5", default_method="POST"
    )
    instances = JsonEndpoint(path="patients/{id_}/instances/")
    instances_tags = JsonEndpoint(path="patients/{id_}/instances-tags/")
    list_metadata = JsonEndpoint(path="patients/{id_}/metadata/")
    metadata = Endpoint(path="patients/{id_}/metadata/{name}/")
    del_metadata = JsonEndpoint(
        path="patients/{id_}/metadata/{name}/", default_method="DELETE"
    )
    put_metadata = JsonEndpoint(
        path="patients/{id_}/metadata/{name}/", default_method="PUT"
    )
    modify = JsonEndpoint(path="patients/{id_}/modify/", default_method="POST")
    module = JsonEndpoint(path="patients/{id_}/module/")
    media = StreamingEndpoint(path="patients/{id_}/media/")
    protected = Endpoint(path="patients/{id_}/protected/")
    put_protected = Endpoint(path="patients/{id_}/protected/", default_method="PUT")
    reconstruct = JsonEndpoint(
        path="patients/{id_}/reconstruct/", default_method="POST"
    )
    series = JsonEndpoint(path="patients/{id_}/series/")
    shared_tags = JsonEndpoint(path="patients/{id_}/shared-tags/")
    statistics = JsonEndpoint(path="patients/{id_}/statistics/")
    studies = JsonEndpoint(path="patients/{id_}/studies/")
