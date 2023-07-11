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

__all__ = ["OrthancInstances"]


class OrthancInstances(Service):

    instances = JsonEndpoint(path="instances/")
    add_instance = JsonEndpoint(path="instances/", default_method="POST")
    instance = JsonEndpoint(path="instances/{id_}/")
    del_instance = JsonEndpoint(path="instances/{id_}/", default_method="DELETE")
    anonymize = JsonEndpoint(path="instances/{id_}/anonymize/", default_method="POST")
    attachments = JsonEndpoint(path="instances/{id_}/attachments")
    attachment = JsonEndpoint(path="instances/{id_}/attachment/{name}/")
    del_attachment = JsonEndpoint(
        path="instances/{id_}/attachment/{name}/", default_method="DELETE"
    )
    put_attachment = JsonEndpoint(
        path="instances/{id_}/attachment/{name}/", default_method="PUT"
    )
    compress_attachment = JsonEndpoint(
        path="instances/{id_}/attachment/{name}/compress", default_method="POST"
    )
    compressed_attachment_data = JsonEndpoint(
        path="instances/{id_}/attachment/{name}/compressed-data"
    )
    compressed_attachment_md5 = JsonEndpoint(
        path="instances/{id_}/attachment/{name}/compressed-md5"
    )
    compressed_attachment_size = JsonEndpoint(
        path="instances/{id_}/attachment/{name}/compressed-size"
    )
    attachment_data = JsonEndpoint(path="instances/{id_}/attachment/{name}/data")
    attachment_is_compressed = JsonEndpoint(
        path="instances/{id_}/attachment/{name}/is-compressed"
    )
    attachment_md5 = JsonEndpoint(path="instances/{id_}/attachment/{name}/md5")
    attachment_size = JsonEndpoint(path="instances/{id_}/attachment/{name}/size")
    uncompress_attachment = JsonEndpoint(
        path="instances/{id_}/attachment/{name}/uncompress", default_method="POST"
    )
    verify_attachment = JsonEndpoint(
        path="instances/{id_}/attachment/{name}/verify-md5", default_method="POST"
    )
    content = JsonEndpoint(path="instances/{id_}/content")
    content_raw_tag = Endpoint(path="instances/{id_}/content/{group}-{element}/")
    # instance_content_raw_seq = JsonEndpoint(path='instances/{id_}/content/{group}-{element}/{index}/')
    export = JsonEndpoint(path="instances/{id_}/export/", default_method="POST")
    file_ = StreamingEndpoint(path="instances/{id_}/file/")
    frames = JsonEndpoint(path="instances/{id_}/frames/")
    frame_int16 = StreamingEndpoint(path="instances/{id_}/frames/{number}/image-int16/")
    frame_uint16 = StreamingEndpoint(
        path="instances/{id_}/frames/{number}/image-uint16/"
    )
    frame_uint8 = StreamingEndpoint(path="instances/{id_}/frames/{number}/image-uint8/")
    frame_matlab = Endpoint(path="instances/{id_}/frames/{number}/matlab/")
    frame_preview = StreamingEndpoint(path="instances/{id_}/frames/{number}/preview/")
    frame_raw = StreamingEndpoint(path="instances/{id_}/frames/{number}/raw/")
    frame_raw_gz = StreamingEndpoint(path="instances/{id_}/frames/{number}/raw.gz/")
    header = JsonEndpoint(path="instances/{id_}/header/")
    image_int16 = StreamingEndpoint(path="instances/{id_}/image-int16/")
    image_uint16 = StreamingEndpoint(path="instances/{id_}/image-uint16/")
    image_uint8 = StreamingEndpoint(path="instances/{id_}/image-uint8/")
    matlab = Endpoint(path="instances/{id_}/matlab/")
    list_metadata = JsonEndpoint(path="instances/{id_}/metadata/")
    metadata = JsonEndpoint(path="instances/{id_}/metadata/{name}/")
    del_metadata = JsonEndpoint(
        path="instances/{id_}/metadata/{name}/", default_method="DELETE"
    )
    put_metadata = JsonEndpoint(
        path="instances/{id_}/metadata/{name}/", default_method="PUT"
    )
    modify = JsonEndpoint(path="instances/{id_}/modify/", default_method="POST")
    module = JsonEndpoint(path="instances/{id_}/module/")
    patient = JsonEndpoint(path="instances/{id_}/patient/")
    pdf = StreamingEndpoint(path="instances/{id_}/pdf/")
    preview = StreamingEndpoint(path="instances/{id_}/preview/")
    reconstruct = JsonEndpoint(
        path="instances/{id_}/reconstruct/", default_method="POST"
    )
    series = JsonEndpoint(path="instances/{id_}/series/")
    simplified_tags = JsonEndpoint(path="instances/{id_}/simplified-tags/")
    statistics = JsonEndpoint(path="instances/{id_}/statistics/")
    study = JsonEndpoint(path="instances/{id_}/study/")
    tags = JsonEndpoint(path="instances/{id_}/tags/")
